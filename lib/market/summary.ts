import type { MarketOffer } from '@/lib/data/offers';

export type MarketSummary = {
  deskCount: number;
  sellDesks: number;
  buyDesks: number;
  fiatCurrencies: string[];
  lowestSpreadBps: number | null;
  totalAvailableUsdc: number;
};

export function summarizeMarket(offers: MarketOffer[]): MarketSummary {
  if (offers.length === 0) {
    return {
      deskCount: 0,
      sellDesks: 0,
      buyDesks: 0,
      fiatCurrencies: [],
      lowestSpreadBps: null,
      totalAvailableUsdc: 0,
    };
  }

  const fiatCurrencies = [
    ...new Set(offers.map((offer) => offer.fiatCurrency)),
  ].sort();

  return {
    deskCount: offers.length,
    sellDesks: offers.filter((o) => o.side === 'sell_usdc').length,
    buyDesks: offers.filter((o) => o.side === 'buy_usdc').length,
    fiatCurrencies,
    lowestSpreadBps: Math.min(...offers.map((o) => o.spreadBps)),
    totalAvailableUsdc: offers.reduce(
      (sum, o) => sum + (Number(o.availableUsdc) || 0),
      0,
    ),
  };
}
