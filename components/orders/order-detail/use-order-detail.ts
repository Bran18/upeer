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
  extractDeployContractId,
  extractUnsignedXdr,
} from '@/lib/trustless-work/client';
import { defaultPaymentMethodId } from '@/components/orders/payment-method-picker';
import { useUpeerSession } from '@/components/session/upeer-session-provider';
import { EMPTY_PAYMENT_PREFS } from '@/lib/profile/payment-prefs';
import {
  exchangePollarSessionFromClient,
  readStoredSession,
  upeerAuthedFetch,
} from '@/lib/upeer-api';
import { mergeOrderDetail, nextStepCopy } from '@/lib/orders/order-detail-helpers';
import {
  fetchEscrowMilestoneStatus,
  waitForEscrowMilestoneApproved,
} from '@/lib/orders/order-escrow-poll';

type Props = {
  orderId: string;
  initial?: OrderDetail | null;
};

export function useOrderDetail({ orderId, initial }: Props) {
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
      const statusBefore = await fetchEscrowMilestoneStatus(orderId);
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


  const action = order ? buyerActionLabel(order.offer.side) : '';
  const canAccept = Boolean(
    order &&
      isMaker &&
      orderCanBeAccepted(
        order.status,
        order.created_at,
        order.quote.expires_at,
      ),
  );
  const showDecline = Boolean(canAccept && order?.status === 'pending_acceptance');
  const showFiat = Boolean(
    order &&
      (order.status === 'reserved' ||
        order.status === 'escrow_pending' ||
        order.status === 'fiat_pending'),
  );
  const escrowContractId = order?.escrow?.tw_contract_id;
  const escrowSetupPhase = Boolean(
    order &&
      (order.status === 'reserved' || order.status === 'escrow_pending'),
  );
  const showEscrowDeploy = Boolean(
    escrowSetupPhase && isUsdcSeller && !escrowContractId,
  );
  const escrowMilestone = order?.escrow?.milestone_state ?? 'idle';
  const escrowFullyFunded = isEscrowFundedForDisplay(
    escrowMilestone,
    escrowOnChain,
  );
  const escrowFundPending = isEscrowFundPending(escrowMilestone, escrowOnChain);
  const showEscrowFund = Boolean(
    escrowSetupPhase &&
      isUsdcSeller &&
      Boolean(escrowContractId) &&
      !shouldHideFundEscrowAction(escrowMilestone, escrowOnChain),
  );
  const showEscrowRelease = Boolean(
    isUsdcSeller &&
      Boolean(escrowContractId) &&
      Boolean(order?.fiat_confirmation.makerReceivedAt) &&
      (order?.status === 'escrow_pending' || order?.status === 'fiat_pending'),
  );
  const showEscrowWaiting = Boolean(
    order &&
      (order.status === 'reserved' ||
        order.status === 'escrow_pending' ||
        order.status === 'fiat_pending') &&
      !isUsdcSeller,
  );
  const showUsdcRelease = Boolean(
    order &&
      (order.status === 'reserved' ||
        order.status === 'escrow_pending' ||
        order.status === 'fiat_pending' ||
        order.status === 'released'),
  );
  const acceptDisabled = Boolean(
    busy ||
      (order?.offer.side === 'sell_usdc' && isMaker && !acceptPaymentMethodId),
  );

  return {
    isAuthenticated,
    verified,
    openLoginModal,
    loadError,
    order,
    busy,
    actionProgress,
    status,
    statusTone,
    confirmDecline,
    setConfirmDecline,
    acceptPaymentMethodId,
    setAcceptPaymentMethodId,
    deployExplorer,
    escrowOnChain,
    escrowStatusError,
    isMaker,
    isTaker,
    isUsdcSeller,
    isUsdcBuyer,
    paymentPrefs,
    stellarNetwork,
    action,
    canAccept,
    showDecline,
    showFiat,
    escrowContractId,
    showEscrowDeploy,
    escrowMilestone,
    escrowFullyFunded,
    escrowFundPending,
    showEscrowFund,
    showEscrowRelease,
    showEscrowWaiting,
    showUsdcRelease,
    acceptDisabled,
    nextStepMessage: order
      ? nextStepCopy(order, profileId, isMaker, isTaker, canAccept)
      : '',
    accept,
    decline,
    confirm,
    deployEscrow,
    fundEscrow,
    approveRelease,
  };
}
