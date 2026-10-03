import type { MarketOffer } from '@/lib/data/offers';

export type MarketSideFilter = 'all' | 'sell_usdc' | 'buy_usdc';
export type MarketSort = 'spread' | 'liquidity' | 'name';

export type MarketFilters = {
  side: MarketSideFilter;
  fiat: string;
  sort: MarketSort;
};

export const DEFAULT_MARKET_FILTERS: MarketFilters = {
  side: 'all',
  fiat: 'all',
  sort: 'spread',
};

export function parseMarketFilters(
  params: Record<string, string | string[] | undefined>,
): MarketFilters {
  const sideRaw = typeof params.side === 'string' ? params.side : 'all';
  const fiatRaw = typeof params.fiat === 'string' ? params.fiat : 'all';
  const sortRaw = typeof params.sort === 'string' ? params.sort : 'spread';

  const side: MarketSideFilter =
    sideRaw === 'sell_usdc' || sideRaw === 'buy_usdc' ? sideRaw : 'all';
  const sort: MarketSort =
    sortRaw === 'liquidity' || sortRaw === 'name' ? sortRaw : 'spread';

  return {
    side,
    fiat: fiatRaw.toUpperCase(),
    sort,
  };
}

export function filterAndSortOffers(
  offers: MarketOffer[],
  filters: MarketFilters,
): MarketOffer[] {
  let result = offers;

  if (filters.side !== 'all') {
    result = result.filter((offer) => offer.side === filters.side);
  }

  if (filters.fiat !== 'all') {
    result = result.filter(
      (offer) => offer.fiatCurrency.toUpperCase() === filters.fiat,
    );
  }

  const sorted = [...result];
  switch (filters.sort) {
    case 'liquidity':
      sorted.sort(
        (a, b) =>
          Number(b.availableUsdc) - Number(a.availableUsdc) ||
          a.spreadBps - b.spreadBps,
      );
      break;
    case 'name':
      sorted.sort((a, b) => a.merchantName.localeCompare(b.merchantName));
      break;
    case 'spread':
    default:
      sorted.sort(
        (a, b) => a.spreadBps - b.spreadBps || a.merchantName.localeCompare(b.merchantName),
      );
  }

  return sorted;
}

export function filtersToSearchParams(filters: MarketFilters): URLSearchParams {
  const params = new URLSearchParams();
  if (filters.side !== 'all') {
    params.set('side', filters.side);
  }
  if (filters.fiat !== 'all') {
    params.set('fiat', filters.fiat);
  }
  if (filters.sort !== 'spread') {
    params.set('sort', filters.sort);
  }
  return params;
}
