'use client';

import { ViewTransition } from 'react';
import type { MarketOffer } from '@/lib/data/offers';
import { AssetBadge } from '@/components/asset-badge';
import { NavLink } from '@/components/transition/nav-link';

type Props = {
  offer: MarketOffer;
  usdcRating?: number;
  usdcIssuer: string;
};

export function OfferCard({ offer, usdcRating, usdcIssuer }: Props) {
  const sideLabel =
    offer.side === 'sell_usdc' ? 'Sells USDC' : 'Buys USDC';

  return (
    <article className="know-card gradient-border-card group p-5 sm:p-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <ViewTransition name={`merchant-${offer.id}`} share="morph" default="none">
            <h2 className="text-headline text-[1.125rem]">{offer.merchantName}</h2>
          </ViewTransition>
          <p className="text-caption mt-1">{sideLabel}</p>
        </div>
        {offer.verified ? (
          <span className="w-fit shrink-0 rounded-full bg-[var(--accent-muted)] px-2.5 py-0.5 text-[11px] font-semibold text-[var(--accent)]">
            Verified
          </span>
        ) : null}
      </div>
      <div className="mt-4 flex flex-wrap items-center gap-2 text-sm sm:mt-5">
        <AssetBadge code="USDC" issuer={usdcIssuer} ratingAverage={usdcRating} />
        <span className="text-[var(--foreground-secondary)]">
          {offer.fiatCurrency} · {offer.spreadBps} bps
        </span>
      </div>
      <p className="mt-3 text-sm tabular-nums text-[var(--foreground-secondary)] sm:mt-4">
        {offer.minUsdc} – {offer.maxUsdc} USDC · {offer.availableUsdc} available
      </p>
      <NavLink
        href={`/trade/${offer.id}`}
        direction="forward"
        className="mt-4 flex min-h-[44px] w-full items-center justify-center rounded-full bg-[var(--accent)] px-5 text-[0.875rem] font-medium text-[var(--accent-ink)] hover:bg-[var(--accent-hover)] sm:mt-5 sm:inline-flex sm:w-auto"
      >
        Start Trade
      </NavLink>
    </article>
  );
}
