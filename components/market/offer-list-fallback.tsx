'use client';

import { MarketToolbar } from '@/components/market/market-toolbar';
import { OfferCard } from '@/components/offer-card';
import type { MarketOffer } from '@/lib/data/offers';
import {
  filterAndSortOffers,
  type MarketFilters,
} from '@/lib/market/filters';

type Props = {
  offers: MarketOffer[];
  filters: MarketFilters;
};

/** Static shell for Suspense while client search params hydrate. */
export function OfferListFallback({ offers, filters }: Props) {
  const fiatOptions = [...new Set(offers.map((offer) => offer.fiatCurrency))].sort();
  const assetOptions = [
    ...new Set(offers.map((offer) => offer.settlementAsset)),
  ].sort();
  const visibleOffers = filterAndSortOffers(offers, filters);

  return (
    <div className="space-y-6" aria-busy="true" aria-live="polite">
      <MarketToolbar
        filters={filters}
        fiatOptions={fiatOptions}
        assetOptions={assetOptions}
        resultCount={visibleOffers.length}
        totalCount={offers.length}
        onChange={() => {}}
      />
      <ul className="grid list-none gap-3 sm:gap-3.5">
        {visibleOffers.map((offer) => (
          <li key={offer.id} className="offer-list-item">
            <OfferCard offer={offer} />
          </li>
        ))}
      </ul>
      <p className="text-xs leading-relaxed text-[var(--foreground-tertiary)] text-pretty">
        Testnet only. Each order shows a fixed price per settlement asset. Escrow is
        on-chain; fiat is settled P2P with your counterparty.
      </p>
    </div>
  );
}
