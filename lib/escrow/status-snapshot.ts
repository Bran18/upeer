import type { EscrowOnChainSnapshot } from '@/lib/escrow/on-chain';
import type { StellarNetwork } from '@/lib/config/network';

export type EscrowStatusSnapshot = {
  state: string;
  contractId?: string | null;
  deployTxHash?: string | null;
  network?: StellarNetwork;
  expectedUsdc?: string | number;
  onChain?: EscrowOnChainSnapshot | null;
  milestoneState?: string;
  statusError?: string | null;
};

export function escrowSnapshotFromOrder(
  order: {
    status: string;
    quote: { usdc_amount: string | number };
    escrow?: {
      tw_contract_id?: string | null;
      milestone_state?: string | null;
    } | null;
  },
  options: {
    network: StellarNetwork;
    onChain?: EscrowOnChainSnapshot | null;
    statusError?: string | null;
    deployTxHash?: string | null;
  },
): EscrowStatusSnapshot {
  const contractId = order.escrow?.tw_contract_id;
  const state =
    order.status === 'released'
      ? 'released'
      : contractId
        ? (order.escrow?.milestone_state ?? 'escrow_pending')
        : 'idle';

  return {
    state,
    contractId,
    deployTxHash: options.deployTxHash ?? null,
    network: options.network,
    expectedUsdc: order.quote.usdc_amount,
    onChain: options.onChain ?? null,
    milestoneState: order.escrow?.milestone_state ?? undefined,
    statusError: options.statusError ?? null,
  };
}
