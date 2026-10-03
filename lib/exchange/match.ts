import type { MarketOffer } from '@/lib/data/offers';
import { marketForCurrency } from '@/lib/fiat/coverage';

export type ExchangeSide = 'buy' | 'sell';

export function counterpartOfferSide(
  side: ExchangeSide,
): MarketOffer['side'] {
  return side === 'buy' ? 'sell_usdc' : 'buy_usdc';
}

export function parseAmount(value: string): number {
  const n = Number(value.replace(/,/g, '').trim());
  return Number.isFinite(n) ? n : 0;
}

export function usdcFromFiat(fiatAmount: number, pricePerUsdc: number): number {
  if (pricePerUsdc <= 0) {
    return 0;
  }
  return fiatAmount / pricePerUsdc;
}

export function fiatFromUsdc(usdcAmount: number, pricePerUsdc: number): number {
  return usdcAmount * pricePerUsdc;
}

export function fallbackPrice(fiatCurrency: string): number {
  const example = Number(marketForCurrency(fiatCurrency)?.examplePricePerUsdc);
  return Number.isFinite(example) && example > 0 ? example : 0;
}

export function matchBestOffer(
  offers: MarketOffer[],
  input: {
    side: ExchangeSide;
    fiatCurrency: string;
    usdcAmount: number;
  },
): MarketOffer | null {
  const wanted = counterpartOfferSide(input.side);
  const currency = input.fiatCurrency.toUpperCase();
  const eligible = offers.filter((offer) => {
    if (offer.side !== wanted) {
      return false;
    }
    if (offer.fiatCurrency.toUpperCase() !== currency) {
      return false;
    }
    const min = Number(offer.minUsdc);
    const max = Math.min(Number(offer.maxUsdc), Number(offer.availableUsdc));
    if (input.usdcAmount <= 0) {
      return max > 0;
    }
    return input.usdcAmount >= min && input.usdcAmount <= max;
  });

  if (eligible.length === 0) {
    return null;
  }

  eligible.sort((a, b) => {
    const aPrice = Number(a.pricePerUsdc);
    const bPrice = Number(b.pricePerUsdc);
    return input.side === 'buy' ? aPrice - bPrice : bPrice - aPrice;
  });

  return eligible[0] ?? null;
}

export function formatExchangeNumber(
  value: number,
  options?: { currency?: string; compact?: boolean },
): string {
  if (!Number.isFinite(value) || value <= 0) {
    return '—';
  }
  const currency = options?.currency;
  const maxFraction =
    currency === 'USDC' ? 2 : value >= 100 ? 0 : value >= 1 ? 2 : 4;
  return new Intl.NumberFormat('en-US', {
    maximumFractionDigits: options?.compact ? Math.min(maxFraction, 2) : maxFraction,
  }).format(value);
}
