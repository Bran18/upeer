import type { MarketOffer } from '@/lib/data/offers';
import { isSupportedFiatCurrency } from '@/lib/fiat/coverage';
import {
  isSettlementAsset,
  type SettlementAsset,
} from '@/lib/settlement/assets';

export type MarketSideFilter = 'all' | 'sell_usdc' | 'buy_usdc';
export type MarketAssetFilter = 'all' | SettlementAsset;
export type MarketSort = 'price' | 'liquidity' | 'name';

export type MarketFilters = {
  side: MarketSideFilter;
  fiat: string;
  asset: MarketAssetFilter;
  sort: MarketSort;
};

export const DEFAULT_MARKET_FILTERS: MarketFilters = {
  side: 'all',
  fiat: 'all',
  asset: 'all',
  sort: 'price',
};

export function parseMarketFilters(
  params: Record<string, string | string[] | undefined>,
): MarketFilters {
  const sideRaw = typeof params.side === 'string' ? params.side : 'all';
  const fiatRaw = typeof params.fiat === 'string' ? params.fiat : 'all';
  const assetRaw = typeof params.asset === 'string' ? params.asset : 'all';
  const sortRaw = typeof params.sort === 'string' ? params.sort : 'price';

  const side: MarketSideFilter =
    sideRaw === 'sell_usdc' || sideRaw === 'buy_usdc' ? sideRaw : 'all';
  const sort: MarketSort =
    sortRaw === 'liquidity' || sortRaw === 'name' ? sortRaw : 'price';

  const fiatUpper = fiatRaw.toUpperCase();
  const fiat =
    fiatUpper === 'all' || isSupportedFiatCurrency(fiatUpper)
      ? fiatUpper
      : 'all';

  const assetUpper = assetRaw.toUpperCase();
  const asset: MarketAssetFilter =
    assetUpper === 'all' || isSettlementAsset(assetUpper)
      ? (assetUpper as MarketAssetFilter)
      : 'all';

  return {
    side,
    fiat,
    asset,
    sort,
  };
}

function priceNumber(offer: MarketOffer): number {
  return Number(offer.pricePerUsdc) || 0;
}

/** For sell orders (you buy USDC), lower price is better. For buy orders, higher is better. */
function compareByPrice(a: MarketOffer, b: MarketOffer): number {
  const aPrice = priceNumber(a);
  const bPrice = priceNumber(b);
  if (a.side === 'sell_usdc' && b.side === 'sell_usdc') {
    return aPrice - bPrice;
  }
  if (a.side === 'buy_usdc' && b.side === 'buy_usdc') {
    return bPrice - aPrice;
  }
  return aPrice - bPrice;
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

  if (filters.asset !== 'all') {
    result = result.filter(
      (offer) => offer.settlementAsset === filters.asset,
    );
  }

  const sorted = [...result];
  switch (filters.sort) {
    case 'liquidity':
      sorted.sort(
        (a, b) =>
          Number(b.availableUsdc) - Number(a.availableUsdc) ||
          compareByPrice(a, b),
      );
      break;
    case 'name':
      sorted.sort((a, b) => a.merchantName.localeCompare(b.merchantName));
      break;
    case 'price':
    default:
      sorted.sort(
        (a, b) =>
          compareByPrice(a, b) ||
          a.merchantName.localeCompare(b.merchantName),
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
  if (filters.asset !== 'all') {
    params.set('asset', filters.asset);
  }
  if (filters.sort !== 'price') {
    params.set('sort', filters.sort);
  }
  return params;
}
