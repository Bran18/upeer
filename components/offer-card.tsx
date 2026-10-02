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
    <article className="glass-panel group p-6 transition hover:border-[var(--accent)]/35 hover:shadow-[0_0_48px_-24px_var(--accent-glow)]">
      <div className="flex items-start justify-between gap-3">
        <div>
          <ViewTransition name={`merchant-${offer.id}`} share="morph" default="none">
            <h2 className="font-[family-name:var(--font-display)] text-xl font-semibold">
              {offer.merchantName}
            </h2>
          </ViewTransition>
          <p className="mt-1 font-mono text-xs uppercase tracking-wider text-[var(--muted)]">
            {sideLabel}
          </p>
        </div>
        {offer.verified ? (
          <span className="rounded-full border border-[var(--accent)]/30 bg-[var(--accent)]/10 px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-[var(--accent)]">
            Verified
          </span>
        ) : null}
      </div>
      <div className="mt-5 flex flex-wrap items-center gap-2 text-sm">
        <AssetBadge code="USDC" issuer={usdcIssuer} ratingAverage={usdcRating} />
        <span className="text-[var(--muted)]">
          {offer.fiatCurrency} · {offer.spreadBps} bps
        </span>
      </div>
      <p className="mt-4 text-sm tabular-nums text-[var(--muted)]">
        {offer.minUsdc} – {offer.maxUsdc} USDC · {offer.availableUsdc} available
      </p>
      <NavLink
        href={`/trade/${offer.id}`}
        direction="forward"
        className="mt-5 inline-flex rounded-full bg-[var(--accent)] px-5 py-2 text-sm font-semibold text-[var(--accent-ink)] transition hover:brightness-110"
      >
        Start trade
      </NavLink>
    </article>
  );
}
