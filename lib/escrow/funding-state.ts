import type { EscrowOnChainSnapshot } from '@/lib/escrow/on-chain';

const MILESTONE_RANK: Record<string, number> = {
  idle: 10,
  deploy_unsigned: 20,
  deploy_submitted: 30,
  fund_unsigned: 40,
  fund_submitted: 50,
  funded: 60,
  released: 70,
};

export function preferMilestoneState(current: string, incoming: string): string {
  const currentRank = MILESTONE_RANK[current] ?? 0;
  const incomingRank = MILESTONE_RANK[incoming] ?? 0;
  return incomingRank >= currentRank ? incoming : current;
}

/** Keep a known-funded snapshot across a failed or empty status poll. */
export function preferOnChainSnapshot(
  current: EscrowOnChainSnapshot | null | undefined,
  incoming: EscrowOnChainSnapshot | null | undefined,
): EscrowOnChainSnapshot | null {
  if (!incoming) {
    return current ?? null;
  }
  if (!current) {
    return incoming;
  }
  if (incoming.released) {
    return incoming;
  }
  if (current.funded && !incoming.funded) {
    return {
      ...incoming,
      balance: Math.max(current.balance, incoming.balance),
      amount: incoming.amount || current.amount,
      funded: true,
      disputed: incoming.disputed || current.disputed,
      approved: incoming.approved || current.approved,
      fundCount: Math.max(current.fundCount ?? 0, incoming.fundCount ?? 0) || undefined,
    };
  }
  if (incoming.balance < current.balance && !incoming.released) {
    return {
      ...incoming,
      balance: current.balance,
      funded: current.funded || incoming.funded,
    };
  }
  return incoming;
}

function hasOnChainFunds(
  onChain: EscrowOnChainSnapshot | null | undefined,
): boolean {
  return Boolean(
    onChain && (onChain.funded || onChain.released || onChain.balance > 0),
  );
}

/** True when the seller should not be offered another fund transaction. */
export function shouldHideFundEscrowAction(
  milestoneState: string,
  onChain: EscrowOnChainSnapshot | null | undefined,
): boolean {
  if (hasOnChainFunds(onChain)) {
    return true;
  }
  if (milestoneState === 'funded' || milestoneState === 'fund_submitted') {
    return true;
  }
  return false;
}

export function isEscrowFundedForDisplay(
  milestoneState: string,
  onChain: EscrowOnChainSnapshot | null | undefined,
): boolean {
  if (onChain?.funded || onChain?.released) {
    return true;
  }
  return milestoneState === 'funded';
}

export function isEscrowFundPending(
  milestoneState: string,
  onChain: EscrowOnChainSnapshot | null | undefined,
): boolean {
  if (isEscrowFundedForDisplay(milestoneState, onChain)) {
    return false;
  }
  return (
    milestoneState === 'fund_submitted' || milestoneState === 'fund_unsigned'
  );
}
