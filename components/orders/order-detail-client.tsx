'use client';

import { useCallback, useEffect, useState } from 'react';
import { usePollar } from '@pollar/react';
import type { OrderDetail } from '@/lib/db/orders';
import { buyerActionLabel } from '@/lib/market/format';
import { orderCanBeAccepted } from '@/lib/quotes/ttl';
import { extractUnsignedXdr } from '@/lib/trustless-work/client';
import { OrderSummary } from '@/components/orders/order-summary';
import { PollarRequired } from '@/components/pollar-required';
import { Button } from '@/components/ui/button';
import {
  exchangePollarSessionFromClient,
  readStoredSession,
  upeerAuthedFetch,
} from '@/lib/upeer-api';

type Props = {
  orderId: string;
  initial?: OrderDetail | null;
};

export function OrderDetailClient({ orderId, initial }: Props) {
  return (
    <PollarRequired
      fallback={
        <div className="ui-card px-5 py-5 sm:px-6 sm:py-6">
          <p className="text-sm text-[var(--foreground-secondary)] text-pretty">
            Set{' '}
            <code className="font-mono text-xs" translate="no">
              NEXT_PUBLIC_POLLAR_PUBLISHABLE_KEY
            </code>{' '}
            to open this order.
          </p>
        </div>
      }
    >
      <OrderDetailInner orderId={orderId} initial={initial} />
    </PollarRequired>
  );
}

function OrderDetailInner({ orderId, initial }: Props) {
  const { wallet, signAndSubmitTx, getClient, isAuthenticated, verified, openLoginModal } =
    usePollar();
  const [order, setOrder] = useState<OrderDetail | null>(initial ?? null);
  const [profileId, setProfileId] = useState<string | null>(null);
  const [status, setStatus] = useState<string | null>(null);
  const [statusTone, setStatusTone] = useState<'error' | 'info'>('info');
  const [busy, setBusy] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [confirmDecline, setConfirmDecline] = useState(false);

  const ensureSession = useCallback(async () => {
    let session = readStoredSession();
    if (!session) {
      session = await exchangePollarSessionFromClient(getClient());
    }
    return session;
  }, [getClient]);

  const loadProfile = useCallback(async () => {
    const me = await upeerAuthedFetch('/api/me');
    const meData = await me.json();
    if (me.ok) {
      setProfileId(meData.profile?.id ?? null);
    }
  }, []);

  const refreshOrder = useCallback(async () => {
    await ensureSession();
    const res = await upeerAuthedFetch(`/api/orders/${orderId}`);
    const data = await res.json();
    if (!res.ok) {
      setLoadError(
        data.error ?? 'Could not load this order. Go back and try again.',
      );
      return;
    }
    setLoadError(null);
    setOrder(data.order);
  }, [orderId, ensureSession]);

  useEffect(() => {
    if (!isAuthenticated || !verified) {
      return;
    }
    void (async () => {
      await ensureSession();
      await Promise.all([refreshOrder(), loadProfile()]);
    })();
    const timer = window.setInterval(() => void refreshOrder(), 8_000);
    return () => window.clearInterval(timer);
  }, [
    isAuthenticated,
    verified,
    ensureSession,
    refreshOrder,
    loadProfile,
  ]);

  const isMaker = Boolean(profileId && order?.maker_profile_id === profileId);
  const isTaker = Boolean(profileId && order?.taker_profile_id === profileId);

  const runAction = async (
    work: () => Promise<void>,
    fallback: string,
  ) => {
    setBusy(true);
    setStatus(null);
    try {
      await work();
      await refreshOrder();
    } catch (e: unknown) {
      setStatusTone('error');
      setStatus(e instanceof Error ? e.message : fallback);
    } finally {
      setBusy(false);
    }
  };

  const accept = () =>
    runAction(async () => {
      await ensureSession();
      const res = await upeerAuthedFetch(`/api/orders/${orderId}/accept`, {
        method: 'POST',
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(
          data.error ?? 'Could not accept this trade. Refresh and try again.',
        );
      }
    }, 'Could not accept this trade. Refresh and try again.');

  const decline = () =>
    runAction(async () => {
      await ensureSession();
      const res = await upeerAuthedFetch(`/api/orders/${orderId}/decline`, {
        method: 'POST',
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(
          data.error ?? 'Could not decline this trade. Refresh and try again.',
        );
      }
      setConfirmDecline(false);
    }, 'Could not decline this trade. Refresh and try again.');

  const confirm = (step: 'fiat_sent' | 'fiat_received') =>
    runAction(async () => {
      await ensureSession();
      const res = await upeerAuthedFetch(`/api/orders/${orderId}/confirm`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ step }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(
          data.error ?? 'Could not save that confirmation. Try again.',
        );
      }
    }, 'Could not save that confirmation. Try again.');

  const deployEscrow = () => {
    if (!wallet?.address) {
      setStatus('Connect a wallet before you deploy escrow.');
      setStatusTone('error');
      return;
    }
    void runAction(async () => {
      await ensureSession();
      const res = await upeerAuthedFetch('/api/escrow/deploy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderId, signer: wallet.address }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(
          data.error ?? 'Could not deploy escrow. Try again.',
        );
      }
      const xdr = data.unsignedTransaction ?? data.xdr;
      if (!xdr) {
        throw new Error('No unsigned XDR returned. Try deploy again.');
      }
      const outcome = await signAndSubmitTx(xdr);
      if (outcome.status === 'success') {
        setStatus(`Deploy submitted: ${outcome.hash}`);
        setStatusTone('info');
        await upeerAuthedFetch('/api/escrow/submit', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            signedXdr: xdr,
            orderId,
            phase: 'deploy',
            contractId: data.contractId,
          }),
        });
      }
    }, 'Could not deploy escrow. Try again.');
  };

  const fundEscrow = () => {
    if (!wallet?.address || !order?.escrow?.tw_contract_id) {
      setStatus('Deploy escrow before you fund it.');
      setStatusTone('error');
      return;
    }
    void runAction(async () => {
      await ensureSession();
      const res = await upeerAuthedFetch('/api/escrow/fund', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          signer: wallet.address,
          escrowContractId: order.escrow?.tw_contract_id,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error ?? 'Could not fund escrow. Try again.');
      }
      const xdr = extractUnsignedXdr(data) ?? data.unsignedTransaction;
      if (!xdr) {
        throw new Error('No fund XDR returned. Try again.');
      }
      await signAndSubmitTx(xdr);
    }, 'Could not fund escrow. Try again.');
  };

  const approveRelease = () => {
    if (!wallet?.address || !order?.escrow?.tw_contract_id) {
      setStatus('Escrow must be deployed before release.');
      setStatusTone('error');
      return;
    }
    if (!order.fiat_confirmation.makerReceivedAt) {
      setStatus('Confirm fiat received before you release USDC.');
      setStatusTone('error');
      return;
    }
    void runAction(async () => {
      await ensureSession();
      const approveRes = await upeerAuthedFetch('/api/escrow/approve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          signer: wallet.address,
          escrowContractId: order.escrow?.tw_contract_id,
        }),
      });
      const approveData = await approveRes.json();
      if (!approveRes.ok) {
        throw new Error(
          approveData.error ?? 'Could not approve release. Try again.',
        );
      }
      const releaseRes = await upeerAuthedFetch('/api/escrow/release', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          signer: wallet.address,
          escrowContractId: order.escrow?.tw_contract_id,
        }),
      });
      const releaseData = await releaseRes.json();
      if (!releaseRes.ok) {
        throw new Error(
          releaseData.error ?? 'Could not release escrow. Try again.',
        );
      }
      const xdr =
        releaseData.unsignedTransaction ??
        releaseData.xdr ??
        approveData.unsignedTransaction;
      if (xdr) {
        await signAndSubmitTx(xdr);
      }
      setStatus('Release submitted.');
      setStatusTone('info');
    }, 'Could not release escrow. Try again.');
  };

  if (!isAuthenticated || !verified) {
    return (
      <div className="ui-card px-5 py-8 text-center sm:px-6">
        <p className="text-base font-medium">Sign In to Open This Order</p>
        <p className="mx-auto mt-2 max-w-md text-sm text-[var(--foreground-secondary)] text-pretty">
          Orders are private to the desk and the taker.
        </p>
        <Button type="button" className="mt-6" onClick={() => openLoginModal()}>
          Sign In
        </Button>
      </div>
    );
  }

  if (loadError && !order) {
    return (
      <p className="text-sm text-red-400" role="status" aria-live="polite">
        {loadError}
      </p>
    );
  }

  if (!order) {
    return (
      <p className="text-sm text-[var(--foreground-tertiary)]">
        Loading order…
      </p>
    );
  }

  const action = buyerActionLabel(order.offer.side);
  const canAccept =
    isMaker &&
    orderCanBeAccepted(
      order.status,
      order.created_at,
      order.quote.expires_at,
    );
  const showDecline = canAccept && order.status === 'pending_acceptance';
  const showFiat =
    order.status === 'reserved' ||
    order.status === 'escrow_pending' ||
    order.status === 'fiat_pending';
  const showEscrow =
    order.status === 'reserved' || order.status === 'escrow_pending';

  return (
    <div>
      <h1 className="text-title-2 text-balance scroll-mt-[var(--site-header-height)]">
        {action}
      </h1>
      <p className="mt-3 max-w-xl text-[0.9375rem] text-[var(--foreground-secondary)] text-pretty">
        Review the locked quote, then complete the next step for your side.
      </p>

      <div className="mt-8 grid gap-4 lg:mt-10 lg:grid-cols-[minmax(0,1.05fr)_minmax(20rem,0.95fr)] lg:items-start">
        <OrderSummary order={order} isMaker={isMaker} />

        <section className="ui-card flex flex-col px-5 py-5 sm:px-6 sm:py-6">
          <h2 className="text-base font-semibold tracking-tight">Next Step</h2>
          <p className="mt-1 text-sm text-[var(--foreground-secondary)] text-pretty">
            {nextStepCopy(order, isMaker, isTaker, canAccept)}
          </p>

          {canAccept ? (
            <div className="mt-6 flex flex-col gap-3">
              <Button
                type="button"
                disabled={busy}
                onClick={() => void accept()}
              >
                {busy ? 'Working…' : 'Accept Trade'}
              </Button>
              {showDecline ? (
                confirmDecline ? (
                <div className="rounded-[var(--radius-ui)] border border-[var(--line)] bg-[var(--fill)] p-3">
                  <p className="text-sm text-[var(--foreground-secondary)] text-pretty">
                    Decline this request? The taker is notified and the quote
                    is released.
                  </p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    <Button
                      type="button"
                      variant="danger"
                      size="sm"
                      disabled={busy}
                      onClick={() => void decline()}
                    >
                      Decline Request
                    </Button>
                    <Button
                      type="button"
                      variant="secondary"
                      size="sm"
                      disabled={busy}
                      onClick={() => setConfirmDecline(false)}
                    >
                      Keep Request
                    </Button>
                  </div>
                </div>
              ) : (
                <Button
                  type="button"
                  variant="secondary"
                  disabled={busy}
                  onClick={() => setConfirmDecline(true)}
                >
                  Decline
                </Button>
              )
              ) : null}
            </div>
          ) : null}

          {showFiat ? (
            <div className="mt-6 space-y-3">
              <p className="text-sm font-medium">Fiat Confirmation</p>
              {isTaker ? (
                <Button
                  type="button"
                  variant="secondary"
                  fullWidth
                  disabled={busy || Boolean(order.fiat_confirmation.takerPaidAt)}
                  onClick={() => void confirm('fiat_sent')}
                >
                  {order.fiat_confirmation.takerPaidAt
                    ? 'Fiat Marked Sent'
                    : 'Mark Fiat Sent'}
                </Button>
              ) : null}
              {isMaker ? (
                <Button
                  type="button"
                  variant="secondary"
                  fullWidth
                  disabled={
                    busy || Boolean(order.fiat_confirmation.makerReceivedAt)
                  }
                  onClick={() => void confirm('fiat_received')}
                >
                  {order.fiat_confirmation.makerReceivedAt
                    ? 'Fiat Marked Received'
                    : 'Mark Fiat Received'}
                </Button>
              ) : null}
            </div>
          ) : null}

          {showEscrow ? (
            <div className="mt-6 flex flex-col gap-3">
              <Button
                type="button"
                disabled={busy}
                onClick={() => deployEscrow()}
              >
                {busy ? 'Working…' : 'Deploy Escrow'}
              </Button>
              {order.escrow?.tw_contract_id ? (
                <Button
                  type="button"
                  variant="secondary"
                  disabled={busy}
                  onClick={() => fundEscrow()}
                >
                  Fund Escrow
                </Button>
              ) : null}
              {isMaker ? (
                <Button
                  type="button"
                  variant="secondary"
                  disabled={busy}
                  onClick={() => approveRelease()}
                >
                  Approve &amp; Release
                </Button>
              ) : null}
            </div>
          ) : null}

          {status ? (
            <p
              className={`mt-4 text-sm ${
                statusTone === 'error'
                  ? 'text-red-400'
                  : 'text-[var(--foreground-secondary)]'
              }`}
              role="status"
              aria-live="polite"
            >
              {status}
            </p>
          ) : null}
          {loadError ? (
            <p
              className="mt-3 text-sm text-red-400"
              role="status"
              aria-live="polite"
            >
              {loadError}
            </p>
          ) : null}
        </section>
      </div>
    </div>
  );
}

function nextStepCopy(
  order: OrderDetail,
  isMaker: boolean,
  isTaker: boolean,
  canAccept: boolean,
): string {
  if (canAccept && isMaker) {
    return 'Accept to lock this take on your desk, or decline to release the quote.';
  }
  if (order.status === 'pending_acceptance' && isTaker) {
    return 'Waiting for the desk to accept. You can leave this page open—it refreshes on its own.';
  }
  if (order.status === 'released') {
    return 'This trade is complete. USDC released and fiat confirmed.';
  }
  if (order.status === 'declined') {
    return 'This request was declined. Open the market to take another desk.';
  }
  if (order.status === 'cancelled') {
    return 'This take expired. Ask the taker to request the trade again.';
  }
  if (isTaker) {
    return 'Send fiat to the desk when you are ready, then mark it sent. Escrow protects the USDC leg.';
  }
  if (isMaker) {
    return 'Confirm when fiat arrives, then deploy, fund, and release escrow.';
  }
  return 'Follow escrow and fiat confirmation until this order is released.';
}
