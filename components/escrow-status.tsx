import {
  stellarExpertContractUrl,
  stellarExpertTxUrl,
  trustlessWorkViewerUrl,
} from '@/lib/stellar/explorer';
import {
  isEscrowFundedForDisplay,
  isEscrowFundPending,
} from '@/lib/escrow/funding-state';
import type { EscrowStatusSnapshot } from '@/lib/escrow/status-snapshot';
import { formatUsdcLabel } from '@/lib/market/format';

type Props = {
  escrow: EscrowStatusSnapshot;
};

function fundingLabel(escrow: EscrowStatusSnapshot): string {
  const { onChain, expectedUsdc, statusError, milestoneState } = escrow;
  if (onChain?.released) {
    return 'Released';
  }
  if (onChain?.disputed) {
    return 'In dispute';
  }
  if (isEscrowFundedForDisplay(milestoneState ?? 'idle', onChain)) {
    if (
      onChain &&
      onChain.amount > 0 &&
      onChain.balance > onChain.amount * 1.01
    ) {
      return onChain.fundCount && onChain.fundCount > 1
        ? `Funded on-chain (${onChain.fundCount} deposits)`
        : 'Funded on-chain';
    }
    return 'Fully funded';
  }
  if (isEscrowFundPending(milestoneState ?? 'idle', onChain)) {
    return 'Funding submitted — confirming on Stellar…';
  }
  if (!onChain) {
    return statusError ?? 'Loading on-chain balance…';
  }
  if (onChain.released) {
    return 'Released';
  }
  if (onChain.funded) {
    if (onChain.amount > 0 && onChain.balance > onChain.amount * 1.01) {
      return `Funded (${onChain.fundCount && onChain.fundCount > 1 ? `${onChain.fundCount} deposits` : 'on-chain'})`;
    }
    return 'Fully funded';
  }
  if (onChain.balance > 0) {
    return 'Partially funded';
  }
  const target = Number(expectedUsdc);
  if (Number.isFinite(target) && target > 0) {
    return `Awaiting ${formatUsdcLabel(target)}`;
  }
  return 'Not funded yet';
}

export function EscrowStatus({ escrow }: Props) {
  const network = escrow.network ?? 'testnet';
  const contractId = escrow.contractId;
  const deployTxHash = escrow.deployTxHash;
  const contractUrl = contractId
    ? stellarExpertContractUrl(network, contractId)
    : null;
  const twViewerUrl = contractId
    ? trustlessWorkViewerUrl(network, contractId)
    : null;
  const txUrl = deployTxHash ? stellarExpertTxUrl(network, deployTxHash) : null;
  const funding = fundingLabel(escrow);
  const { onChain, statusError } = escrow;

  return (
    <div className="panel-card">
      <p className="text-sm text-subtle">Trustless Work Escrow</p>
      <p className="mt-1 font-medium capitalize">
        {escrow.state.replaceAll('_', ' ')}
      </p>
      <p className="mt-2 text-sm font-medium text-[var(--foreground-secondary)]">
        {funding}
      </p>
      {onChain && contractId ? (
        <dl className="mt-3 space-y-1.5 text-sm">
          <div className="flex justify-between gap-3">
            <dt className="text-[var(--foreground-tertiary)]">On-chain balance</dt>
            <dd className="font-medium tabular-nums">
              {formatUsdcLabel(onChain.balance)}
            </dd>
          </div>
          <div className="flex justify-between gap-3">
            <dt className="text-[var(--foreground-tertiary)]">Escrow target</dt>
            <dd className="font-medium tabular-nums">
              {formatUsdcLabel(onChain.amount)}
            </dd>
          </div>
        </dl>
      ) : null}
      {statusError ? (
        <p className="mt-2 text-xs text-[var(--foreground-tertiary)]">
          {statusError}
        </p>
      ) : null}
      {contractId ? (
        <p
          className="mt-2 truncate font-mono text-xs text-muted"
          translate="no"
          title={contractId}
        >
          {contractId}
        </p>
      ) : null}
      {twViewerUrl ? (
        <a
          href={twViewerUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-3 inline-block text-sm font-medium text-[var(--accent)] hover:underline"
        >
          View escrow on Trustless Work
        </a>
      ) : null}
      {contractUrl ? (
        <a
          href={contractUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-2 block text-sm text-[var(--foreground-secondary)] hover:underline"
        >
          Stellar Expert (contract)
        </a>
      ) : null}
      {txUrl ? (
        <a
          href={txUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-2 block text-sm text-[var(--foreground-secondary)] hover:underline"
        >
          Deploy transaction
        </a>
      ) : null}
    </div>
  );
}
