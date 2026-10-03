'use client';

import { PaymentMethodPicker } from '@/components/orders/payment-method-picker';
import { WalletActionProgress } from '@/components/orders/wallet-action-progress';
import { useOrderDetailContext } from '@/components/orders/order-detail/context';
import { Button } from '@/components/ui/button';
import {
  stellarExpertContractUrl,
  stellarExpertTxUrl,
} from '@/lib/stellar/explorer';

export function OrderDetailActionsPanel() {
  const ctx = useOrderDetailContext();
  const { order } = ctx;
  if (!order) {
    return null;
  }

  const {
    busy,
    actionProgress,
    nextStepMessage,
    canAccept,
    showDecline,
    showFiat,
    isMaker,
    isUsdcBuyer,
    isUsdcSeller,
    paymentPrefs,
    acceptPaymentMethodId,
    setAcceptPaymentMethodId,
    acceptDisabled,
    confirmDecline,
    setConfirmDecline,
    showEscrowDeploy,
    showEscrowFund,
    escrowFundPending,
    escrowContractId,
    escrowFullyFunded,
    showEscrowRelease,
    showEscrowWaiting,
    escrowOnChain,
    status,
    statusTone,
    deployExplorer,
    stellarNetwork,
    loadError,
    accept,
    decline,
    confirm,
    deployEscrow,
    fundEscrow,
    approveRelease,
  } = ctx;

  return (
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
          {nextStepMessage}
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
                    Decline this request? The taker is notified and the quote is
                    released.
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
  );
}
