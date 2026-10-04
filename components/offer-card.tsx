'use client';

import type { ReactNode } from 'react';
import { memo } from 'react';
import { ViewTransition } from 'react';
import type { MarketOffer } from '@/lib/data/offers';
import { formatFiatBadge } from '@/lib/fiat/coverage';
import { NavLink } from '@/components/transition/nav-link';
import { Avatar } from '@/components/ui/avatar';
import {
  buyerActionLabel,
  formatPricePerUsdc,
  formatUsdcAmount,
  formatUsdcLabel,
} from '@/lib/market/format';
import { offerFillBounds } from '@/lib/market/take';

type Props = {
  offer: MarketOffer;
};

function OfferTag({
  tone,
  children,
}: {
  tone: 'buy' | 'sell' | 'fiat' | 'verified';
  children: ReactNode;
}) {
  return <span className={`offer-tag offer-tag--${tone}`}>{children}</span>;
}

function CardArrowIcon() {
  return (
    <span className="inline-flex" aria-hidden="true">
      <svg
        aria-hidden="true"
        className="h-4 w-4 shrink-0 text-[var(--foreground-tertiary)] transition-colors duration-200 group-hover:text-[var(--foreground)]"
        viewBox="0 0 16 16"
        fill="none"
      >
        <path
          d="M4.5 11.5L11.5 4.5M11.5 4.5H6M11.5 4.5V10"
          stroke="currentColor"
          strokeWidth="1.35"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </span>
  );
}

export const OfferCard = memo(function OfferCard({ offer }: Props) {
  const action = buyerActionLabel(offer.side);
  const tagTone = offer.side === 'sell_usdc' ? 'buy' : 'sell';
  const priceLabel = formatPricePerUsdc(offer.fiatCurrency, offer.pricePerUsdc);
  const { min, max } = offerFillBounds(offer);
  const available = formatUsdcLabel(offer.availableUsdc);

  return (
    <NavLink
      href={`/trade/${offer.id}`}
      direction="forward"
      className="offer-card group text-left no-underline"
      aria-label={`${action} with ${offer.merchantName} at ${priceLabel} per USDC`}
    >
      <div className="flex min-w-0 items-start gap-3 md:max-w-[18rem] md:shrink-0 md:items-center">
        <Avatar
          label={offer.merchantName}
          size="lg"
          className="ring-2 ring-[var(--line)] ring-offset-2 ring-offset-[var(--surface-elevated)]"
        />
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <ViewTransition
              name={`merchant-${offer.id}`}
              share="morph"
              default="none"
            >
              <h2 className="truncate text-[0.9375rem] font-semibold tracking-tight text-[var(--foreground)]">
                {offer.merchantName}
              </h2>
            </ViewTransition>
            <span className="md:hidden">
              <CardArrowIcon />
            </span>
          </div>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <OfferTag tone={tagTone}>{action}</OfferTag>
            <OfferTag tone="fiat">{formatFiatBadge(offer.fiatCurrency)}</OfferTag>
            {offer.verified ? <OfferTag tone="verified">Verified</OfferTag> : null}
          </div>
        </div>
      </div>

      <div className="mt-4 grid min-w-0 flex-1 gap-3 md:mt-0 md:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)_auto] md:items-center md:gap-6">
        <div className="min-w-0">
          <p className="text-[0.625rem] font-medium uppercase tracking-[0.14em] text-[var(--foreground-tertiary)]">
            Price per USDC
          </p>
          <p className="mt-1 truncate text-[1.5rem] font-semibold leading-none tracking-tight tabular-nums text-[var(--foreground)]">
            {priceLabel}
          </p>
        </div>
        <div className="min-w-0">
          <p className="text-[0.625rem] font-medium uppercase tracking-[0.14em] text-[var(--foreground-tertiary)]">
            Available
          </p>
          <p className="mt-1 text-sm font-medium tabular-nums text-[var(--foreground)]">
            {available}
          </p>
          <p className="mt-0.5 text-xs tabular-nums text-[var(--foreground-tertiary)]">
            {formatUsdcAmount(String(min))}–{formatUsdcAmount(String(max))} per
            fill
          </p>
        </div>
        <span className="hidden items-center gap-2 text-sm font-medium text-[var(--accent)] md:inline-flex">
          Take Offer
          <CardArrowIcon />
        </span>
      </div>
    </NavLink>
  );
});
