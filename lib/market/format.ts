export function formatUsdcAmount(value: string): string {
  const n = Number(value);
  if (!Number.isFinite(n)) {
    return value;
  }
  return new Intl.NumberFormat('en-US', {
    maximumFractionDigits: n >= 100 ? 0 : 2,
  }).format(n);
}

export function formatSpreadBps(bps: number): string {
  return `${bps} bps`;
}

export function formatSpreadPercent(bps: number): string {
  return `${(bps / 100).toFixed(2)}%`;
}

export function buyerActionLabel(side: 'sell_usdc' | 'buy_usdc'): string {
  return side === 'sell_usdc' ? 'Buy USDC' : 'Sell USDC';
}

export function buyerActionDescription(side: 'sell_usdc' | 'buy_usdc'): string {
  return side === 'sell_usdc'
    ? 'You pay fiat with the desk; USDC releases from escrow when milestones clear.'
    : 'You send USDC through escrow; fiat settles with the desk off-chain.';
}
