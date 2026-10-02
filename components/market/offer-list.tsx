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
  return (
    <div className="mt-10 space-y-4">
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
