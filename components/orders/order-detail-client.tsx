'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { usePollar } from '@pollar/react';
import type { OrderDetail } from '@/lib/db/orders';
import { buyerActionLabel } from '@/lib/market/format';
import { orderCanBeAccepted } from '@/lib/quotes/ttl';
import { getStellarNetworkClient } from '@/lib/config/network-client';
import type { EscrowOnChainSnapshot } from '@/lib/escrow/on-chain';
import {
  isEscrowFundedForDisplay,
  isEscrowFundPending,
  preferMilestoneState,
  preferOnChainSnapshot,
  shouldHideFundEscrowAction,
} from '@/lib/escrow/funding-state';
import {
  isUsdcBuyerProfile,
  isUsdcSellerProfile,
  p2pLegs,
} from '@/lib/escrow/p2p-legs';
import {
  stellarExpertContractUrl,
  stellarExpertTxUrl,
} from '@/lib/stellar/explorer';
import {
  extractDeployContractId,
  extractUnsignedXdr,
} from '@/lib/trustless-work/client';
import { OrderSettlementDetails } from '@/components/orders/order-settlement-details';
import {
  defaultPaymentMethodId,
  PaymentMethodPicker,
} from '@/components/orders/payment-method-picker';
import { OrderSummary } from '@/components/orders/order-summary';
import { useUpeerSession } from '@/components/session/upeer-session-provider';
import { EMPTY_PAYMENT_PREFS } from '@/lib/profile/payment-prefs';
import { WalletActionProgress } from '@/components/orders/wallet-action-progress';
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
  const { profile } = useUpeerSession();
  const [order, setOrder] = useState<OrderDetail | null>(initial ?? null);
  const [profileId, setProfileId] = useState<string | null>(null);
  const [status, setStatus] = useState<string | null>(null);
  const [statusTone, setStatusTone] = useState<'error' | 'info'>('info');
  const [busy, setBusy] = useState(false);
  const [actionProgress, setActionProgress] = useState<{
    headline: string;
    detail: string;
    walletHint?: boolean;
  } | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [confirmDecline, setConfirmDecline] = useState(false);
  const [acceptPaymentMethodId, setAcceptPaymentMethodId] = useState<
    string | null
  >(null);
  const [deployExplorer, setDeployExplorer] = useState<{
    contractId?: string;
    txHash?: string;
    fundTxHash?: string;
  } | null>(null);
  const [escrowOnChain, setEscrowOnChain] =
    useState<EscrowOnChainSnapshot | null>(null);
  const [escrowStatusError, setEscrowStatusError] = useState<string | null>(
    null,
  );
  const refreshInFlight = useRef(false);
  const stellarNetwork = getStellarNetworkClient();

  useEffect(() => {
    if (!busy) {
      return;
    }
    const onBeforeUnload = (event: BeforeUnloadEvent) => {
      event.preventDefault();
      event.returnValue = '';
    };
    window.addEventListener('beforeunload', onBeforeUnload);
    return () => window.removeEventListener('beforeunload', onBeforeUnload);
  }, [busy]);

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

  const refreshOrder = useCallback(
    async (options?: { syncTxHash?: string | null; force?: boolean }) => {
      if (refreshInFlight.current && !options?.force) {
        return;
      }
      refreshInFlight.current = true;
      try {
        await ensureSession();
        const res = await upeerAuthedFetch(`/api/orders/${orderId}`);
        let data: { order?: OrderDetail | null; error?: string } = {};
        try {
          data = await res.json();
        } catch {
          return;
        }
        if (!res.ok) {
          setLoadError(
            data.error ?? 'Could not load this order. Go back and try again.',
          );
          return;
        }
        if (!data.order) {
          return;
        }
        setLoadError(null);
        setOrder((prev) => mergeOrderDetail(prev, data.order as OrderDetail));

        if (data.order.escrow?.tw_contract_id) {
          const txForSync = options?.syncTxHash ?? null;
          const statusQuery = new URLSearchParams({ orderId });
          if (txForSync) {
            statusQuery.set('txHash', txForSync);
          }
          const statusRes = await upeerAuthedFetch(
            `/api/escrow/status?${statusQuery}`,
          );
          let statusData: {
            snapshot?: EscrowOnChainSnapshot | null;
            error?: string;
            milestoneState?: string;
          } = {};
          try {
            statusData = await statusRes.json();
          } catch {
            return;
          }
          if (statusRes.ok) {
            setEscrowOnChain((prev) =>
              preferOnChainSnapshot(prev, statusData.snapshot ?? null),
            );
            setEscrowStatusError(
              typeof statusData.error === 'string' ? statusData.error : null,
            );
            const milestoneState =
              typeof statusData.milestoneState === 'string'
                ? statusData.milestoneState
                : null;
            if (milestoneState) {
              setOrder((prev) =>
                prev?.escrow
                  ? {
                      ...prev,
                      escrow: {
                        ...prev.escrow,
                        milestone_state: preferMilestoneState(
                          prev.escrow.milestone_state,
                          milestoneState,
                        ),
                      },
                    }
                  : prev,
              );
            }
          }
        }
      } finally {
        refreshInFlight.current = false;
      }
    },
    [orderId, ensureSession],
  );

  useEffect(() => {
    if (!isAuthenticated || !verified) {
      return;
    }
    void (async () => {
      await ensureSession();
      await Promise.all([refreshOrder(), loadProfile()]);
    })();
    const timer = window.setInterval(() => void refreshOrder(), 12_000);
    return () => window.clearInterval(timer);
  }, [
    isAuthenticated,
    verified,
    ensureSession,
    refreshOrder,
    loadProfile,
  ]);

  useEffect(() => {
    if (!order || !wallet?.address || !profileId) {
      return;
    }
    const legs = p2pLegs({
      side: order.offer.side,
      makerProfileId: order.maker_profile_id ?? '',
      takerProfileId: order.taker_profile_id ?? '',
      makerPayoutAddress: null,
      takerStellarAddress: null,
    });
    if (legs.usdcSellerProfileId !== profileId) {
      return;
    }
    if (order.escrow?.tw_contract_id) {
      return;
    }
    const state = order.escrow?.milestone_state ?? '';
    if (!state.startsWith('deploy')) {
      return;
    }

    void (async () => {
      await ensureSession();
      const res = await upeerAuthedFetch('/api/escrow/resolve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderId, signer: wallet.address }),
      });
      if (res.ok) {
        await refreshOrder();
      }
    })();
  }, [
    order,
    wallet?.address,
    profileId,
    orderId,
    ensureSession,
    refreshOrder,
  ]);

  const isMaker = Boolean(profileId && order?.maker_profile_id === profileId);
  const isTaker = Boolean(profileId && order?.taker_profile_id === profileId);

  const p2pInput =
    order && profileId
      ? {
          side: order.offer.side,
          makerProfileId: order.maker_profile_id ?? '',
          takerProfileId: order.taker_profile_id ?? '',
          makerPayoutAddress: null,
          takerStellarAddress: null,
        }
      : null;
  const isUsdcSeller = Boolean(
    p2pInput && profileId && isUsdcSellerProfile(p2pInput, profileId),
  );
  const isUsdcBuyer = Boolean(
    p2pInput && profileId && isUsdcBuyerProfile(p2pInput, profileId),
  );

  const paymentPrefs = profile?.paymentPrefs ?? EMPTY_PAYMENT_PREFS;
  const makerPicksFiatOnAccept = Boolean(
    order &&
      profileId &&
      order.maker_profile_id === profileId &&
      orderCanBeAccepted(
        order.status,
        order.created_at,
        order.quote.expires_at,
      ) &&
      order.offer.side === 'sell_usdc',
  );

  useEffect(() => {
    if (!makerPicksFiatOnAccept || !order) {
      return;
    }
    setAcceptPaymentMethodId(
      defaultPaymentMethodId(paymentPrefs, order.quote.fiat_currency),
    );
  }, [makerPicksFiatOnAccept, order?.quote.fiat_currency, paymentPrefs]);

  const reportProgress = (
    detail: string,
    headline = 'Working on this trade',
    walletHint = false,
  ) => {
    setActionProgress({ headline, detail, walletHint });
  };

  const runAction = async (
    work: () => Promise<void | string>,
    fallback: string,
    options?: { headline?: string; initialDetail?: string },
  ) => {
    setBusy(true);
    setStatus(null);
    setActionProgress({
      headline: options?.headline ?? 'Working on this trade',
      detail: options?.initialDetail ?? 'Please wait…',
    });
    try {
      const syncTxHash = await work();
      reportProgress('Updating order status…');
      await refreshOrder(
        typeof syncTxHash === 'string'
          ? { syncTxHash, force: true }
          : { force: true },
      );
    } catch (e: unknown) {
      setStatusTone('error');
      setStatus(e instanceof Error ? e.message : fallback);
    } finally {
      setBusy(false);
      setActionProgress(null);
    }
  };

  const accept = () =>
    runAction(async () => {
      await ensureSession();
      const payload: { paymentMethodId?: string } = {};
      if (order?.offer.side === 'sell_usdc') {
        if (!acceptPaymentMethodId) {
          throw new Error(
            'Choose how you receive fiat for this trade before accepting.',
          );
        }
        payload.paymentMethodId = acceptPaymentMethodId;
      }
      const res = await upeerAuthedFetch(`/api/orders/${orderId}/accept`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
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
    void runAction(
      async () => {
      await ensureSession();
      reportProgress('Preparing the deploy transaction…', 'Deploy escrow');
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
      const contractId =
        extractDeployContractId(data as Record<string, unknown>) ??
        (typeof data.contractId === 'string' ? data.contractId : null);
      reportProgress(
        'Sign the deploy transaction in Pollar',
        'Deploy escrow',
        true,
      );
      const outcome = await signAndSubmitTx(xdr);
      if (outcome.status === 'success') {
        reportProgress('Recording escrow on UPEER…', 'Deploy escrow');
        setStatusTone('info');
        setStatus(
          contractId
            ? `Deploy submitted. Fund escrow when the contract is live on-chain.`
            : `Deploy submitted: ${outcome.hash.slice(0, 12)}…`,
        );
        setDeployExplorer({ contractId: contractId ?? undefined, txHash: outcome.hash });
        const ackRes = await upeerAuthedFetch('/api/escrow/submit', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            submittedViaWallet: true,
            txHash: outcome.hash,
            signer: wallet.address,
            orderId,
            phase: 'deploy',
            contractId: contractId ?? undefined,
          }),
        });
        const ackData = await ackRes.json();
        if (ackRes.ok && typeof ackData.contractId === 'string') {
          setDeployExplorer({
            contractId: ackData.contractId,
            txHash: outcome.hash,
          });
        }
        return outcome.hash;
      }
      throw new Error(
        'message' in outcome && typeof outcome.message === 'string'
          ? outcome.message
          : 'Deploy was not completed in your wallet.',
      );
    },
      'Could not deploy escrow. Try again.',
      { headline: 'Deploy escrow', initialDetail: 'Starting…' },
    );
  };

  const fundEscrow = () => {
    if (!wallet?.address || !order?.escrow?.tw_contract_id) {
      setStatus('Deploy escrow before you fund it.');
      setStatusTone('error');
      return;
    }
    void runAction(
      async () => {
      await ensureSession();
      reportProgress('Preparing the fund transaction…', 'Fund escrow');
      const res = await upeerAuthedFetch('/api/escrow/fund', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orderId,
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
      reportProgress('Sign the fund transaction in Pollar', 'Fund escrow', true);
      const outcome = await signAndSubmitTx(xdr);
      if (outcome.status === 'success') {
        reportProgress('Recording fund on UPEER…', 'Fund escrow');
        setStatusTone('info');
        setStatus(
          'Fund submitted. Escrow balance updates after the transaction confirms on-chain.',
        );
        setDeployExplorer((prev) => ({
          ...prev,
          fundTxHash: outcome.hash,
        }));
        setOrder((prev) =>
          prev?.escrow
            ? {
                ...prev,
                escrow: {
                  ...prev.escrow,
                  milestone_state: preferMilestoneState(
                    prev.escrow.milestone_state,
                    'fund_submitted',
                  ),
                },
              }
            : prev,
        );
        const ackRes = await upeerAuthedFetch('/api/escrow/submit', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            submittedViaWallet: true,
            txHash: outcome.hash,
            signer: wallet.address,
            orderId,
            phase: 'fund',
          }),
        });
        const ackData = await ackRes.json();
        if (!ackRes.ok) {
          throw new Error(
            ackData.error ?? 'Fund tx sent but order state did not update.',
          );
        }
        return outcome.hash;
      } else if (outcome.status === 'error') {
        throw new Error(
          'message' in outcome && typeof outcome.message === 'string'
            ? outcome.message
            : 'Fund was not completed in your wallet.',
        );
      }
    },
      'Could not fund escrow. Try again.',
      { headline: 'Fund escrow', initialDetail: 'Starting…' },
    );
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
    void runAction(
      async () => {
      await ensureSession();
      const escrowBody = {
        orderId,
        signer: wallet.address,
        escrowContractId: order.escrow?.tw_contract_id,
      };

      reportProgress('Checking escrow status…', 'Approve & release USDC');
      const statusBefore = await fetchEscrowStatus(orderId);
      const milestoneAlreadyApproved = Boolean(statusBefore.snapshot?.approved);

      if (!milestoneAlreadyApproved) {
        reportProgress(
          'Preparing milestone approval…',
          'Approve & release USDC',
        );
        const approveRes = await upeerAuthedFetch('/api/escrow/approve', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(escrowBody),
        });
        const approveData = await approveRes.json();
        if (!approveRes.ok) {
          throw new Error(
            approveData.error ?? 'Could not approve release. Try again.',
          );
        }

        const approveXdr = extractUnsignedXdr(approveData);
        if (!approveXdr) {
          throw new Error('No approve transaction returned. Try again.');
        }
        reportProgress(
          'Sign the approval in Pollar (step 1 of 2)',
          'Approve & release USDC',
          true,
        );
        const approveOutcome = await signAndSubmitTx(approveXdr);
        if (approveOutcome.status !== 'success') {
          throw new Error(
            'message' in approveOutcome &&
              typeof approveOutcome.message === 'string'
              ? approveOutcome.message
              : 'Approve was not completed in your wallet.',
          );
        }
        reportProgress('Recording approval…', 'Approve & release USDC');
        await upeerAuthedFetch('/api/escrow/submit', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            submittedViaWallet: true,
            txHash: approveOutcome.hash,
            signer: wallet.address,
            orderId,
            phase: 'approve',
          }),
        });
        await waitForEscrowMilestoneApproved(
          orderId,
          approveOutcome.hash,
          (attempt) => {
            reportProgress(
              attempt === 0
                ? 'Waiting for Stellar to confirm approval…'
                : `Still confirming approval on Stellar (${attempt + 1})…`,
              'Approve & release USDC',
            );
          },
        );
      }

      reportProgress('Preparing USDC release…', 'Approve & release USDC');
      const releaseRes = await upeerAuthedFetch('/api/escrow/release', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(escrowBody),
      });
      const releaseData = await releaseRes.json();
      if (!releaseRes.ok) {
        throw new Error(
          releaseData.error ?? 'Could not release escrow. Try again.',
        );
      }

      const releaseXdr = extractUnsignedXdr(releaseData);
      if (!releaseXdr) {
        throw new Error('No release transaction returned. Try again.');
      }
      reportProgress(
        'Sign the release in Pollar (step 2 of 2)',
        'Approve & release USDC',
        true,
      );
      const releaseOutcome = await signAndSubmitTx(releaseXdr);
      if (releaseOutcome.status !== 'success') {
        throw new Error(
          'message' in releaseOutcome && typeof releaseOutcome.message === 'string'
            ? releaseOutcome.message
            : 'Release was not completed in your wallet.',
        );
      }
      reportProgress('Finishing release…', 'Approve & release USDC');
      await upeerAuthedFetch('/api/escrow/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          submittedViaWallet: true,
          txHash: releaseOutcome.hash,
          signer: wallet.address,
          orderId,
          phase: 'release',
        }),
      });
      setStatus('Release submitted.');
      setStatusTone('info');
    },
      'Could not release escrow. Try again.',
      {
        headline: 'Approve & release USDC',
        initialDetail: 'Starting…',
      },
    );
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
  const escrowContractId = order.escrow?.tw_contract_id;
  const escrowSetupPhase =
    order.status === 'reserved' || order.status === 'escrow_pending';
  const showEscrowDeploy =
    escrowSetupPhase && isUsdcSeller && !escrowContractId;
  const escrowMilestone = order.escrow?.milestone_state ?? 'idle';
  const escrowFullyFunded = isEscrowFundedForDisplay(
    escrowMilestone,
    escrowOnChain,
  );
  const escrowFundPending = isEscrowFundPending(escrowMilestone, escrowOnChain);
  const showEscrowFund =
    escrowSetupPhase &&
    isUsdcSeller &&
    Boolean(escrowContractId) &&
    !shouldHideFundEscrowAction(escrowMilestone, escrowOnChain);
  const showEscrowRelease =
    isUsdcSeller &&
    Boolean(escrowContractId) &&
    Boolean(order.fiat_confirmation.makerReceivedAt) &&
    (order.status === 'escrow_pending' || order.status === 'fiat_pending');
  const showEscrowWaiting =
    (order.status === 'reserved' ||
      order.status === 'escrow_pending' ||
      order.status === 'fiat_pending') &&
    !isUsdcSeller;

  const showUsdcRelease =
    order.status === 'reserved' ||
    order.status === 'escrow_pending' ||
    order.status === 'fiat_pending' ||
    order.status === 'released';

  const acceptDisabled =
    busy ||
    (order.offer.side === 'sell_usdc' && isMaker && !acceptPaymentMethodId);

  return (
    <div>
      <h1 className="text-title-2 text-balance scroll-mt-[var(--site-header-height)]">
        {action}
      </h1>
      <p className="mt-3 max-w-xl text-[0.9375rem] text-[var(--foreground-secondary)] text-pretty">
        Review the locked quote, then complete the next step for your side.
      </p>

      <div className="mt-8 grid gap-4 lg:mt-10 lg:grid-cols-[minmax(0,1.05fr)_minmax(20rem,0.95fr)] lg:items-start">
        <div className="flex flex-col gap-4">
          <OrderSummary
            order={order}
            isMaker={isMaker}
            escrowOnChain={escrowOnChain}
            escrowStatusError={escrowStatusError}
          />
          {order.fiatSettlement || showUsdcRelease ? (
            <div className="ui-card px-5 py-5 sm:px-6 sm:py-6">
              <OrderSettlementDetails
                fiatSettlement={order.fiatSettlement}
                usdcReleaseAddress={order.usdcReleaseAddress}
                showUsdcRelease={showUsdcRelease}
                viewerIsUsdcBuyer={isUsdcBuyer}
                viewerIsUsdcSeller={isUsdcSeller}
              />
            </div>
          ) : null}
        </div>

        <section className="relative ui-card flex flex-col px-5 py-5 sm:px-6 sm:py-6">
          {busy && actionProgress ? (
            <div
              className="absolute inset-0 z-20 flex items-center justify-center rounded-[inherit] bg-[var(--background)]/75 px-4 backdrop-blur-[2px]"
              aria-hidden={false}
            >
              <WalletActionProgress
                headline={actionProgress.headline}
                detail={actionProgress.detail}
                walletHint={actionProgress.walletHint}
              />
            </div>
          ) : null}
          <div
            className={busy ? 'pointer-events-none select-none opacity-40' : undefined}
            aria-hidden={busy ? true : undefined}
          >
          <h2 className="text-base font-semibold tracking-tight">Next Step</h2>
          <p className="mt-1 text-sm text-[var(--foreground-secondary)] text-pretty">
            {nextStepCopy(order, profileId, isMaker, isTaker, canAccept)}
          </p>

          {canAccept ? (
            <div className="mt-6 flex flex-col gap-3">
              {canAccept && order.offer.side === 'sell_usdc' && isMaker ? (
                <PaymentMethodPicker
                  currency={order.quote.fiat_currency}
                  prefs={paymentPrefs}
                  value={acceptPaymentMethodId}
                  onChange={setAcceptPaymentMethodId}
                  disabled={busy}
                  legend="How you receive fiat"
                />
              ) : null}
              <Button
                type="button"
                disabled={acceptDisabled}
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
              {isUsdcBuyer ? (
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
              {isUsdcSeller ? (
                <>
                  <Button
                    type="button"
                    variant="secondary"
                    fullWidth
                    disabled={
                      busy ||
                      !order.fiat_confirmation.takerPaidAt ||
                      Boolean(order.fiat_confirmation.makerReceivedAt)
                    }
                    onClick={() => void confirm('fiat_received')}
                  >
                    {order.fiat_confirmation.makerReceivedAt
                      ? 'Fiat Marked Received'
                      : 'Mark Fiat Received'}
                  </Button>
                  {!order.fiat_confirmation.takerPaidAt &&
                  !order.fiat_confirmation.makerReceivedAt ? (
                    <p className="text-xs text-[var(--foreground-tertiary)] text-pretty">
                      Available after your counterparty marks fiat sent.
                    </p>
                  ) : null}
                </>
              ) : null}
            </div>
          ) : null}

          {showEscrowDeploy ? (
            <div className="mt-6">
              <Button
                type="button"
                disabled={busy}
                onClick={() => deployEscrow()}
              >
                {busy ? 'Working…' : 'Deploy Escrow'}
              </Button>
            </div>
          ) : null}

          {showEscrowFund ? (
            <div className="mt-6 space-y-3">
              <Button
                type="button"
                variant="secondary"
                fullWidth
                disabled={busy || escrowFundPending}
                onClick={() => fundEscrow()}
              >
                Fund Escrow
              </Button>
              <p className="text-xs text-[var(--foreground-tertiary)] text-pretty">
                You will sign a wallet transaction for the full order size. Balance
                appears in the escrow panel after confirmation.
              </p>
            </div>
          ) : null}

          {escrowContractId && escrowFundPending && isUsdcSeller ? (
            <p className="mt-6 text-sm text-[var(--foreground-secondary)] text-pretty">
              Fund transaction submitted. Balance updates in the escrow panel once
              Stellar confirms — you cannot fund again until then.
            </p>
          ) : null}

          {escrowContractId && escrowFullyFunded && isUsdcSeller ? (
            <p className="mt-6 text-sm text-[var(--foreground-secondary)] text-pretty">
              Escrow is funded on-chain. Continue with fiat confirmation, then
              approve and release.
            </p>
          ) : null}

          {showEscrowRelease ? (
            <div className="mt-6">
              <Button
                type="button"
                variant="secondary"
                fullWidth
                disabled={busy}
                onClick={() => approveRelease()}
              >
                Approve &amp; Release USDC
              </Button>
            </div>
          ) : null}

          {showEscrowWaiting ? (
            <p className="mt-6 text-sm text-[var(--foreground-secondary)] text-pretty">
              {escrowFullyFunded
                ? 'USDC is in escrow. Complete your fiat step when you are ready.'
                : escrowFundPending || (escrowOnChain?.balance ?? 0) > 0
                  ? 'Seller is funding escrow — balance updates in the escrow panel on the left.'
                  : 'Waiting for the USDC seller to deploy and fund escrow.'}
            </p>
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
          {(deployExplorer?.contractId ?? escrowContractId) ? (
            <a
              href={stellarExpertContractUrl(
                stellarNetwork,
                (deployExplorer?.contractId ?? escrowContractId)!,
              )}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-2 inline-block text-sm font-medium text-[var(--accent)] hover:underline"
            >
              View escrow on Stellar Expert
            </a>
          ) : null}
          {deployExplorer?.txHash ? (
            <a
              href={stellarExpertTxUrl(stellarNetwork, deployExplorer.txHash)}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-2 block text-sm text-[var(--foreground-secondary)] hover:underline"
            >
              Deploy transaction on Stellar Expert
            </a>
          ) : null}
          {deployExplorer?.fundTxHash ? (
            <a
              href={stellarExpertTxUrl(stellarNetwork, deployExplorer.fundTxHash)}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-2 block text-sm text-[var(--foreground-secondary)] hover:underline"
            >
              Fund transaction on Stellar Expert
            </a>
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
          </div>
        </section>
      </div>
    </div>
  );
}

type EscrowStatusPayload = {
  snapshot?: { approved?: boolean; released?: boolean } | null;
};

async function fetchEscrowStatus(
  orderId: string,
  txHash?: string,
): Promise<EscrowStatusPayload> {
  const params = new URLSearchParams({ orderId });
  if (txHash) {
    params.set('txHash', txHash);
  }
  const res = await upeerAuthedFetch(`/api/escrow/status?${params}`);
  return (await res.json()) as EscrowStatusPayload;
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function waitForEscrowMilestoneApproved(
  orderId: string,
  approveTxHash: string,
  onPoll?: (attempt: number) => void,
): Promise<void> {
  const maxAttempts = 25;
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    onPoll?.(attempt);
    const data = await fetchEscrowStatus(orderId, approveTxHash);
    if (data.snapshot?.approved || data.snapshot?.released) {
      return;
    }
    await delay(Math.min(1500 + attempt * 250, 4000));
  }
  throw new Error(
    'Milestone approval is still confirming on Stellar. Wait a moment, then try Approve & Release again.',
  );
}

function mergeOrderDetail(
  prev: OrderDetail | null,
  next: OrderDetail,
): OrderDetail {
  if (!prev) {
    return next;
  }
  const prevEscrow = prev.escrow;
  const nextEscrow = next.escrow;
  if (!prevEscrow && !nextEscrow) {
    return next;
  }
  return {
    ...next,
    escrow: {
      tw_contract_id:
        nextEscrow?.tw_contract_id ?? prevEscrow?.tw_contract_id ?? null,
      last_error: nextEscrow?.last_error ?? prevEscrow?.last_error ?? null,
      milestone_state: preferMilestoneState(
        prevEscrow?.milestone_state ?? 'idle',
        nextEscrow?.milestone_state ?? 'idle',
      ),
    },
  };
}

function nextStepCopy(
  order: OrderDetail,
  profileId: string | null,
  isMaker: boolean,
  isTaker: boolean,
  canAccept: boolean,
): string {
  const legs =
    profileId && order.maker_profile_id && order.taker_profile_id
      ? p2pLegs({
          side: order.offer.side,
          makerProfileId: order.maker_profile_id,
          takerProfileId: order.taker_profile_id,
          makerPayoutAddress: null,
          takerStellarAddress: null,
        })
      : null;
  const isSeller =
    legs && profileId ? legs.usdcSellerProfileId === profileId : false;
  const isBuyer =
    legs && profileId ? legs.usdcBuyerProfileId === profileId : false;
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
  if (isBuyer) {
    return 'Send fiat to your counterparty when ready, then mark it sent. USDC stays in escrow until the seller releases.';
  }
  if (isSeller) {
    if (!order.fiat_confirmation.takerPaidAt) {
      return 'Deploy and fund escrow with USDC. You can confirm fiat received only after the buyer marks fiat sent.';
    }
    return 'Deploy and fund escrow with USDC, confirm when fiat arrives, then approve and release.';
  }
  if (isTaker) {
    return 'Complete fiat confirmation and wait for the USDC seller to move escrow forward.';
  }
  if (isMaker) {
    return 'Complete the next step on your side of this trade.';
  }
  return 'Follow escrow and fiat confirmation until this order is released.';
}
