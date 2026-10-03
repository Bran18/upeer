import type { MarketOffer } from '@/lib/data/offers';

export type MarketSummary = {
  orderCount: number;
  sellOrders: number;
  buyOrders: number;
  fiatCurrencies: string[];
  /** Lowest ask among sell-USDC orders (best for buyers). */
  bestSellPrice: number | null;
  bestSellPriceCurrency: string | null;
  totalAvailableUsdc: number;
};

export function summarizeMarket(offers: MarketOffer[]): MarketSummary {
  if (offers.length === 0) {
    return {
      orderCount: 0,
      sellOrders: 0,
      buyOrders: 0,
      fiatCurrencies: [],
      bestSellPrice: null,
      bestSellPriceCurrency: null,
      totalAvailableUsdc: 0,
    };
  }

  const fiatCurrencies = [
    ...new Set(offers.map((offer) => offer.fiatCurrency)),
  ].sort();

  const sellOffers = offers.filter((o) => o.side === 'sell_usdc');
  let bestSellPrice: number | null = null;
  let bestSellPriceCurrency: string | null = null;
  if (sellOffers.length > 0) {
    const best = sellOffers.reduce((min, o) => {
      const p = Number(o.pricePerUsdc);
      return p < Number(min.pricePerUsdc) ? o : min;
    });
    bestSellPrice = Number(best.pricePerUsdc);
    bestSellPriceCurrency = best.fiatCurrency;
  }

  return {
    orderCount: offers.length,
    sellOrders: sellOffers.length,
    buyOrders: offers.filter((o) => o.side === 'buy_usdc').length,
    fiatCurrencies,
    bestSellPrice,
    bestSellPriceCurrency,
    totalAvailableUsdc: offers.reduce(
      (sum, o) => sum + (Number(o.availableUsdc) || 0),
      0,
    ),
  };
}
