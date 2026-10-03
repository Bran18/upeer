'use client';

import { startTransition, useCallback, useMemo } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { ViewTransition } from 'react';
import { MarketEmpty } from '@/components/market/market-empty';
import { MarketToolbar } from '@/components/market/market-toolbar';
import { OfferCard } from '@/components/offer-card';
import type { MarketOffer } from '@/lib/data/offers';
import {
  DEFAULT_MARKET_FILTERS,
  filterAndSortOffers,
  filtersToSearchParams,
  parseMarketFilters,
  type MarketFilters,
} from '@/lib/market/filters';

type Props = {
  offers: MarketOffer[];
  initialFilters?: MarketFilters;
};

export function OfferList({ offers, initialFilters }: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const filters = useMemo(() => {
    if (searchParams.toString()) {
      return parseMarketFilters(Object.fromEntries(searchParams.entries()));
    }
    return initialFilters ?? DEFAULT_MARKET_FILTERS;
  }, [searchParams, initialFilters]);

  const fiatOptions = useMemo(
    () => [...new Set(offers.map((offer) => offer.fiatCurrency))].sort(),
    [offers],
  );

  const visibleOffers = useMemo(
    () => filterAndSortOffers(offers, filters),
    [offers, filters],
  );

  const updateFilters = useCallback(
    (patch: Partial<MarketFilters>) => {
      const next = { ...filters, ...patch };
      const params = filtersToSearchParams(next);
      const query = params.toString();
      startTransition(() => {
        router.replace(query ? `${pathname}?${query}` : pathname, {
          scroll: false,
        });
      });
    },
    [filters, pathname, router],
  );

  const resetFilters = useCallback(() => {
    startTransition(() => {
      router.replace(pathname, { scroll: false });
    });
  }, [pathname, router]);

  if (offers.length === 0) {
    return <MarketEmpty filtered={false} />;
  }

  return (
    <div className="space-y-6">
      <MarketToolbar
        filters={filters}
        fiatOptions={fiatOptions}
        resultCount={visibleOffers.length}
        totalCount={offers.length}
        onChange={updateFilters}
      />

      {visibleOffers.length === 0 ? (
        <MarketEmpty filtered onResetFilters={resetFilters} />
      ) : (
        <ul className="grid list-none gap-3">
          {visibleOffers.map((offer) => (
            <li key={offer.id} className="offer-list-item">
              <ViewTransition>
                <OfferCard offer={offer} />
              </ViewTransition>
            </li>
          ))}
        </ul>
      )}

      <p className="text-xs leading-relaxed text-[var(--foreground-tertiary)] text-pretty">
        Testnet only. Each order shows a fixed price per USDC. Escrow is
        on-chain; fiat is settled P2P with your counterparty.
      </p>
    </div>
  );
}
