import type { EscrowOnChainSnapshot } from '@/lib/escrow/on-chain';

/** True when the seller should not be offered another fund transaction. */
export function shouldHideFundEscrowAction(
  milestoneState: string,
  onChain: EscrowOnChainSnapshot | null | undefined,
): boolean {
  if (onChain?.funded) {
    return true;
  }
  if (milestoneState === 'funded') {
    return true;
  }
  if (milestoneState === 'fund_submitted') {
    return true;
  }
  return false;
}

export function isEscrowFundedForDisplay(
  milestoneState: string,
  onChain: EscrowOnChainSnapshot | null | undefined,
): boolean {
  if (onChain?.funded) {
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
  return milestoneState === 'fund_submitted';
}
