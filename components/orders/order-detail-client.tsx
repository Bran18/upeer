'use client';

import { usePollar } from '@pollar/react';
import { useCallback, useEffect, useState } from 'react';
import type { OrderDetail } from '@/lib/db/orders';
import { QuoteCard } from '@/components/quote-card';
import { EscrowStatus } from '@/components/escrow-status';
import { PollarRequired } from '@/components/pollar-required';
import { extractUnsignedXdr } from '@/lib/trustless-work/client';
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
    <PollarRequired>
      <OrderDetailInner orderId={orderId} initial={initial} />
    </PollarRequired>
  );
}

function OrderDetailInner({ orderId, initial }: Props) {
  const { wallet, signAndSubmitTx, getClient, isAuthenticated, verified } =
    usePollar();
  const [order, setOrder] = useState<OrderDetail | null>(initial ?? null);
  const [profileId, setProfileId] = useState<string | null>(null);
  const [status, setStatus] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const ensureSession = useCallback(async () => {
    let session = readStoredSession();
    if (!session) {
      session = await exchangePollarSessionFromClient(getClient());
    }
    return session;
  }, [getClient]);

  const refresh = useCallback(async () => {
    await ensureSession();
    const res = await upeerAuthedFetch(`/api/orders/${orderId}`);
    const data = await res.json();
    if (res.ok) {
      setOrder(data.order);
      const me = await upeerAuthedFetch('/api/me');
      const meData = await me.json();
      if (me.ok) {
        setProfileId(meData.profile?.id ?? null);
      }
    }
  }, [orderId, ensureSession]);

  useEffect(() => {
    void refresh();
    const t = window.setInterval(() => void refresh(), 8_000);
    return () => window.clearInterval(t);
  }, [refresh]);

  const isMaker = profileId && order?.maker_profile_id === profileId;
  const isTaker = profileId && order?.taker_profile_id === profileId;

  const accept = async () => {
    setBusy(true);
    try {
      await ensureSession();
      const res = await upeerAuthedFetch(`/api/orders/${orderId}/accept`, {
        method: 'POST',
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error ?? 'Accept failed');
      }
      await refresh();
    } catch (e: unknown) {
      setStatus(e instanceof Error ? e.message : 'Accept failed');
    } finally {
      setBusy(false);
    }
  };

  const decline = async () => {
    setBusy(true);
    try {
      await ensureSession();
      const res = await upeerAuthedFetch(`/api/orders/${orderId}/decline`, {
        method: 'POST',
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error ?? 'Decline failed');
      }
      await refresh();
    } catch (e: unknown) {
      setStatus(e instanceof Error ? e.message : 'Decline failed');
    } finally {
      setBusy(false);
    }
  };

  const confirm = async (step: 'fiat_sent' | 'fiat_received') => {
    setBusy(true);
    try {
      await ensureSession();
      const res = await upeerAuthedFetch(`/api/orders/${orderId}/confirm`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ step }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error ?? 'Confirm failed');
      }
      await refresh();
    } catch (e: unknown) {
      setStatus(e instanceof Error ? e.message : 'Confirm failed');
    } finally {
      setBusy(false);
    }
  };

  const deployEscrow = async () => {
    if (!wallet?.address) {
      return;
    }
    setBusy(true);
    try {
      await ensureSession();
      const res = await upeerAuthedFetch('/api/escrow/deploy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderId, signer: wallet.address }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error ?? 'Deploy failed');
      }
      const xdr = data.unsignedTransaction ?? data.xdr;
      if (!xdr) {
        throw new Error('No unsigned XDR');
      }
      const outcome = await signAndSubmitTx(xdr);
      if (outcome.status === 'success') {
        setStatus(`Deploy submitted: ${outcome.hash}`);
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
      await refresh();
    } catch (e: unknown) {
      setStatus(e instanceof Error ? e.message : 'Deploy failed');
    } finally {
      setBusy(false);
    }
  };

  const fundEscrow = async () => {
    if (!wallet?.address || !order?.escrow?.tw_contract_id) {
      return;
    }
    setBusy(true);
    try {
      await ensureSession();
      const res = await upeerAuthedFetch('/api/escrow/fund', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          signer: wallet.address,
          escrowContractId: order.escrow.tw_contract_id,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error ?? 'Fund failed');
      }
      const xdr = extractUnsignedXdr(data) ?? data.unsignedTransaction;
      if (!xdr) {
        throw new Error('No fund XDR');
      }
      await signAndSubmitTx(xdr);
      await refresh();
    } catch (e: unknown) {
      setStatus(e instanceof Error ? e.message : 'Fund failed');
    } finally {
      setBusy(false);
    }
  };

  const approveRelease = async () => {
    if (!wallet?.address || !order?.escrow?.tw_contract_id) {
      return;
    }
    if (!order.fiat_confirmation.makerReceivedAt) {
      setStatus('Maker must confirm fiat received before release.');
      return;
    }
    setBusy(true);
    try {
      await ensureSession();
      const approveRes = await upeerAuthedFetch('/api/escrow/approve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          signer: wallet.address,
          escrowContractId: order.escrow.tw_contract_id,
        }),
      });
      const approveData = await approveRes.json();
      if (!approveRes.ok) {
        throw new Error(approveData.error ?? 'Approve failed');
      }
      const releaseRes = await upeerAuthedFetch('/api/escrow/release', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          signer: wallet.address,
          escrowContractId: order.escrow.tw_contract_id,
        }),
      });
      const releaseData = await releaseRes.json();
      if (!releaseRes.ok) {
        throw new Error(releaseData.error ?? 'Release failed');
      }
      const xdr =
        releaseData.unsignedTransaction ?? releaseData.xdr ?? approveData.unsignedTransaction;
      if (xdr) {
        await signAndSubmitTx(xdr);
      }
      await refresh();
      setStatus('Release flow submitted.');
    } catch (e: unknown) {
      setStatus(e instanceof Error ? e.message : 'Release failed');
    } finally {
      setBusy(false);
    }
  };

  if (!order) {
    return <p className="text-sm text-muted">Loading order…</p>;
  }

  const price =
    (order.quote.reflector_snapshot?.pricePerUsdc as string) ??
    order.offer.price_per_usdc;

  return (
    <div className="space-y-8">
      <div>
        <p className="text-xs uppercase tracking-widest text-[var(--foreground-tertiary)]">
          Order · {order.status.replace(/_/g, ' ')}
        </p>
        <h1 className="mt-2 text-2xl font-medium">
          {order.offer.side === 'sell_usdc' ? 'Buy USDC' : 'Sell USDC'} ·{' '}
          {order.offer.fiat_currency}
        </h1>
      </div>

      <QuoteCard
        fiatCurrency={order.quote.fiat_currency}
        usdcAmount={order.quote.usdc_amount}
        fiatAmount={order.quote.fiat_amount}
        pricePerUsdc={price}
        expiresAt={order.quote.expires_at}
      />

      {order.status === 'pending_acceptance' && isMaker ? (
        <div className="flex flex-wrap gap-3">
          <button
            type="button"
            className="btn-primary"
            disabled={busy}
            onClick={() => void accept()}
          >
            Accept trade
          </button>
          <button
            type="button"
            className="btn-secondary"
            disabled={busy}
            onClick={() => void decline()}
          >
            Decline
          </button>
        </div>
      ) : null}

      {order.status === 'pending_acceptance' && isTaker ? (
        <p className="text-sm text-[var(--foreground-secondary)]">
          Waiting for the maker to accept your request…
        </p>
      ) : null}

      {['reserved', 'escrow_pending', 'fiat_pending'].includes(order.status) ? (
        <section className="panel-card space-y-3">
          <h2 className="text-sm font-medium">Fiat confirmation (P2P)</h2>
          {isTaker ? (
            <button
              type="button"
              className="btn-secondary"
              disabled={busy || Boolean(order.fiat_confirmation.takerPaidAt)}
              onClick={() => void confirm('fiat_sent')}
            >
              {order.fiat_confirmation.takerPaidAt
                ? 'Fiat marked sent'
                : 'I sent fiat'}
            </button>
          ) : null}
          {isMaker ? (
            <button
              type="button"
              className="btn-secondary"
              disabled={busy || Boolean(order.fiat_confirmation.makerReceivedAt)}
              onClick={() => void confirm('fiat_received')}
            >
              {order.fiat_confirmation.makerReceivedAt
                ? 'Fiat marked received'
                : 'I received fiat'}
            </button>
          ) : null}
        </section>
      ) : null}

      {order.status === 'reserved' || order.status === 'escrow_pending' ? (
        <div className="flex flex-wrap gap-3">
          <button
            type="button"
            className="btn-primary"
            disabled={!isAuthenticated || !verified || busy}
            onClick={() => void deployEscrow()}
          >
            Deploy escrow
          </button>
          {order.escrow?.tw_contract_id ? (
            <button
              type="button"
              className="btn-secondary"
              disabled={busy}
              onClick={() => void fundEscrow()}
            >
              Fund escrow
            </button>
          ) : null}
          {isMaker ? (
            <button
              type="button"
              className="btn-secondary"
              disabled={busy}
              onClick={() => void approveRelease()}
            >
              Approve & release
            </button>
          ) : null}
        </div>
      ) : null}

      <EscrowStatus
        state={
          order.status === 'released'
            ? 'released'
            : order.escrow?.tw_contract_id
              ? 'escrow_pending'
              : 'idle'
        }
        contractId={order.escrow?.tw_contract_id}
      />

      {status ? (
        <p className="text-sm text-muted" role="status">{status}</p>
      ) : null}
    </div>
  );
}
