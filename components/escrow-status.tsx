import {
  stellarExpertContractUrl,
  stellarExpertTxUrl,
} from '@/lib/stellar/explorer';
import type { StellarNetwork } from '@/lib/config/network';

type Props = {
  state: string;
  contractId?: string | null;
  deployTxHash?: string | null;
  network?: StellarNetwork;
};

export function EscrowStatus({
  state,
  contractId,
  deployTxHash,
  network = 'testnet',
}: Props) {
  const contractUrl = contractId
    ? stellarExpertContractUrl(network, contractId)
    : null;
  const txUrl = deployTxHash ? stellarExpertTxUrl(network, deployTxHash) : null;

  return (
    <div className="panel-card">
      <p className="text-sm text-subtle">Trustless Work Escrow</p>
      <p className="mt-1 font-medium capitalize">{state.replaceAll('_', ' ')}</p>
      {contractId ? (
        <p
          className="mt-2 truncate font-mono text-xs text-muted"
          translate="no"
          title={contractId}
        >
          {contractId}
        </p>
      ) : null}
      {contractUrl ? (
        <a
          href={contractUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-3 inline-block text-sm font-medium text-[var(--accent)] hover:underline"
        >
          View escrow on Stellar Expert
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
