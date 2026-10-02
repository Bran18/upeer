'use client';

import { ViewTransition } from 'react';
import { OfferCard } from '@/components/offer-card';
import type { MarketOffer } from '@/lib/data/offers';

type Props = {
  offers: MarketOffer[];
  usdcIssuer: string;
  usdcRating?: number;
};

export function OfferList({ offers, usdcIssuer, usdcRating }: Props) {
  if (offers.length === 0) {
    return (
      <p className="text-body mt-10 rounded-[var(--radius-card)] border border-dashed border-[var(--line)] px-6 py-14 text-center">
        No live offers yet. Check back shortly—or publish one as a merchant.
      </p>
    );
  }

  return (
    <div className="mt-4 space-y-4">
      {offers.map((offer) => (
        <ViewTransition key={offer.id}>
          <OfferCard
            offer={offer}
            usdcIssuer={usdcIssuer}
            usdcRating={usdcRating}
          />
        </ViewTransition>
      ))}
    </div>
  );
}
