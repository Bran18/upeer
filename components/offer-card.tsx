'use client';

import type { ReactNode } from 'react';
import { ViewTransition } from 'react';
import type { MarketOffer } from '@/lib/data/offers';
import { formatFiatBadge } from '@/lib/fiat/coverage';
import { NavLink } from '@/components/transition/nav-link';
import { Avatar } from '@/components/ui/avatar';
import {
  buyerActionLabel,
  formatPricePerUsdc,
  formatUsdcAmount,
  orderSideLabel,
} from '@/lib/market/format';

type Props = {
  offer: MarketOffer;
  usdcRating?: number;
  usdcIssuer: string;
};

function merchantSubtitle(offer: MarketOffer): string {
  return `${orderSideLabel(offer.side)} · ${offer.fiatCurrency}`;
}

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
    <svg
      aria-hidden="true"
      className="h-4 w-4 shrink-0 text-[var(--foreground-tertiary)] transition-colors group-hover:text-[var(--foreground)]"
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
  );
}

export function OfferCard({ offer }: Props) {
  const action = buyerActionLabel(offer.side);
  const tagTone = offer.side === 'sell_usdc' ? 'buy' : 'sell';
  const priceLabel = formatPricePerUsdc(offer.fiatCurrency, offer.pricePerUsdc);
  const available = formatUsdcAmount(offer.availableUsdc);

  return (
    <NavLink
      href={`/trade/${offer.id}`}
      direction="forward"
      className="offer-card group text-left no-underline"
      aria-label={`${action} with ${offer.merchantName} at ${priceLabel} per USDC`}
    >
      <div className="flex items-start gap-3">
        <Avatar
          label={offer.merchantName}
          size="lg"
          className="ring-2 ring-[var(--line)] ring-offset-2 ring-offset-[var(--surface-elevated)]"
        />
        <div className="min-w-0 flex-1 pt-0.5">
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
            <CardArrowIcon />
          </div>
          <p className="mt-0.5 line-clamp-2 text-xs leading-snug text-[var(--foreground-tertiary)]">
            {merchantSubtitle(offer)}
          </p>
        </div>
      </div>

      <div className="mt-5 flex-1">
        <p className="text-[0.625rem] font-medium uppercase tracking-[0.14em] text-[var(--foreground-tertiary)]">
          Price per USDC
        </p>
        <div className="mt-1 flex flex-wrap items-baseline gap-x-2.5 gap-y-0">
          <span className="text-[1.75rem] font-semibold leading-none tracking-tight tabular-nums text-[var(--foreground)]">
            {priceLabel}
          </span>
        </div>
        <p className="mt-1 text-xs text-[var(--foreground-secondary)] tabular-nums">
          {available} USDC available · {formatUsdcAmount(offer.minUsdc)}–
          {formatUsdcAmount(offer.maxUsdc)} per fill
        </p>
      </div>

      <div className="mt-5 flex flex-wrap items-center gap-1.5">
        <OfferTag tone={tagTone}>{action}</OfferTag>
        <OfferTag tone="fiat">{formatFiatBadge(offer.fiatCurrency)}</OfferTag>
        {offer.verified ? <OfferTag tone="verified">Verified</OfferTag> : null}
      </div>
    </NavLink>
  );
}
