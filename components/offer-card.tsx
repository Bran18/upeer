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
    <article className="surface-card group p-6 transition hover:shadow-[var(--shadow-elevated)]">
      <div className="flex items-start justify-between gap-3">
        <div>
          <ViewTransition name={`merchant-${offer.id}`} share="morph" default="none">
            <h2 className="text-headline text-[1.125rem]">{offer.merchantName}</h2>
          </ViewTransition>
          <p className="text-caption mt-1">{sideLabel}</p>
        </div>
        {offer.verified ? (
          <span className="rounded-full bg-[var(--accent-muted)] px-2.5 py-0.5 text-[11px] font-semibold text-[var(--accent)]">
            Verified
          </span>
        ) : null}
      </div>
      <div className="mt-5 flex flex-wrap items-center gap-2 text-sm">
        <AssetBadge code="USDC" issuer={usdcIssuer} ratingAverage={usdcRating} />
        <span className="text-[var(--foreground-secondary)]">
          {offer.fiatCurrency} · {offer.spreadBps} bps
        </span>
      </div>
      <p className="mt-4 text-sm tabular-nums text-[var(--foreground-secondary)]">
        {offer.minUsdc} – {offer.maxUsdc} USDC · {offer.availableUsdc} available
      </p>
      <NavLink
        href={`/trade/${offer.id}`}
        direction="forward"
        className="mt-5 inline-flex min-h-[40px] items-center rounded-full bg-[var(--accent)] px-5 text-[0.875rem] font-medium text-[var(--accent-ink)] hover:bg-[var(--accent-hover)]"
      >
        Start trade
      </NavLink>
    </article>
  );
}
