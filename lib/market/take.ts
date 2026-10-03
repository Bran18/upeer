import type { MarketOffer } from '@/lib/data/offers';

export function offerFillBounds(offer: MarketOffer): {
  min: number;
  max: number;
} {
  const min = Number(offer.minUsdc);
  const available = Number(offer.availableUsdc);
  const maxCap = Number(offer.maxUsdc);
  const max = Math.min(
    Number.isFinite(maxCap) ? maxCap : available,
    Number.isFinite(available) ? available : maxCap,
  );
  return {
    min: Number.isFinite(min) ? min : 0,
    max: Number.isFinite(max) ? max : 0,
  };
}

export function defaultTakeUsdc(
  offer: MarketOffer,
  initial?: string,
): string {
  const parsed = initial ? Number(initial) : NaN;
  if (Number.isFinite(parsed) && parsed > 0) {
    return initial as string;
  }

  const { min, max } = offerFillBounds(offer);
  if (max <= 0) {
    return min > 0 ? String(min) : '100';
  }

  const preferred = 100;
  if (preferred >= min && preferred <= max) {
    return '100';
  }
  return String(min);
}

export function amountInFillRange(
  amount: number,
  offer: MarketOffer,
): boolean {
  const { min, max } = offerFillBounds(offer);
  return amount > 0 && amount >= min && amount <= max;
}
