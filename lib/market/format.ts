export function formatUsdcAmount(value: string): string {
  const n = Number(value);
  if (!Number.isFinite(n)) {
    return value;
  }
  return new Intl.NumberFormat('en-US', {
    maximumFractionDigits: n >= 100 ? 0 : 2,
  }).format(n);
}

export function formatUsdcLabel(value: string | number): string {
  return `${formatUsdcAmount(String(value))}\u00a0USDC`;
}

export function formatFiatTotal(
  fiatCurrency: string,
  amount: number,
): string {
  if (!Number.isFinite(amount) || amount <= 0) {
    return '—';
  }
  const formatted = new Intl.NumberFormat('en-US', {
    maximumFractionDigits: amount >= 100 ? 0 : amount >= 1 ? 2 : 4,
  }).format(amount);
  return `${formatted}\u00a0${fiatCurrency}`;
}

/** Fiat units paid or received per 1 USDC on this order. */
export function formatPricePerUsdc(
  fiatCurrency: string,
  pricePerUsdc: string | number,
): string {
  const n = Number(pricePerUsdc);
  if (!Number.isFinite(n)) {
    return `${pricePerUsdc}\u00a0${fiatCurrency}`;
  }
  const formatted = new Intl.NumberFormat('en-US', {
    maximumFractionDigits: n >= 100 ? 2 : 4,
  }).format(n);
  return `${formatted}\u00a0${fiatCurrency}`;
}

export function buyerActionLabel(side: 'sell_usdc' | 'buy_usdc'): string {
  return side === 'sell_usdc' ? 'Buy USDC' : 'Sell USDC';
}

export function buyerActionDescription(side: 'sell_usdc' | 'buy_usdc'): string {
  return side === 'sell_usdc'
    ? 'Take this sell order — you send fiat, USDC releases from escrow.'
    : 'Take this buy order — you send USDC, fiat settles with the counterparty.';
}

export function orderSideLabel(side: 'sell_usdc' | 'buy_usdc'): string {
  return side === 'sell_usdc' ? 'Sell order' : 'Buy order';
}
