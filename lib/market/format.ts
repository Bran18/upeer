import type { SettlementAsset } from '@/lib/settlement/assets';
import {
  buyerActionLabelForAsset,
  formatAmountWithAsset,
  formatPricePerUnit,
} from '@/lib/settlement/assets';

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

export function formatSettlementLabel(
  value: string | number,
  asset: SettlementAsset,
): string {
  return formatAmountWithAsset(value, asset);
}

export function formatPriceForOffer(
  fiatCurrency: string,
  pricePerUsdc: string | number,
  asset: SettlementAsset,
): string {
  return formatPricePerUnit(fiatCurrency, pricePerUsdc, asset);
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

/** Fiat units paid or received per 1 unit of the settlement asset. */
export function formatPricePerUsdc(
  fiatCurrency: string,
  pricePerUsdc: string | number,
  asset: SettlementAsset = 'USDC',
): string {
  return formatPricePerUnit(fiatCurrency, pricePerUsdc, asset);
}

export function buyerActionLabel(
  side: 'sell_usdc' | 'buy_usdc',
  asset: SettlementAsset = 'USDC',
): string {
  return buyerActionLabelForAsset(side, asset);
}

export function buyerActionDescription(
  side: 'sell_usdc' | 'buy_usdc',
  asset: SettlementAsset = 'USDC',
): string {
  return side === 'sell_usdc'
    ? `Take this sell order — you send fiat, ${asset} releases from escrow.`
    : `Take this buy order — you send ${asset}, fiat settles with the counterparty.`;
}

export function orderSideLabel(side: 'sell_usdc' | 'buy_usdc'): string {
  return side === 'sell_usdc' ? 'Sell order' : 'Buy order';
}
