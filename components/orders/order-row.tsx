'use client';

import type { ReactNode } from 'react';
import { memo } from 'react';
import { ViewTransition } from 'react';
import type { OrderDetail } from '@/lib/db/orders';
import { formatFiatBadge } from '@/lib/fiat/coverage';
import {
  buyerActionLabel,
  formatFiatTotal,
  formatUsdcLabel,
} from '@/lib/market/format';
import {
  formatOrderDate,
  formatOrderProgress,
  orderStatusTone,
  viewerRoleLabel,
} from '@/lib/orders/format';
import { NavLink } from '@/components/transition/nav-link';
import { Avatar } from '@/components/ui/avatar';

type Props = {
  order: OrderDetail;
  isMaker: boolean;
};

function OrderTag({
  tone,
  children,
}: {
  tone: 'buy' | 'sell' | 'fiat' | 'pending' | 'live' | 'done' | 'danger';
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

export const OrderRow = memo(function OrderRow({ order, isMaker }: Props) {
  const action = buyerActionLabel(order.offer.side);
  const tagTone = order.offer.side === 'sell_usdc' ? 'buy' : 'sell';
  const deskName = order.offer.maker_display_name?.trim() || 'Desk';
  const usdcLabel = formatUsdcLabel(order.quote.usdc_amount);
  const fiatLabel = formatFiatTotal(
    order.quote.fiat_currency,
    Number(order.quote.fiat_amount),
  );
  const statusLabel = formatOrderProgress(order);
  const statusTone = orderStatusTone(order.status);

  return (
    <NavLink
      href={`/orders/${order.id}`}
      direction="forward"
      className="offer-card group text-left no-underline"
      aria-label={`${action} · ${statusLabel} · ${usdcLabel}`}
    >
      <div className="flex min-w-0 items-start gap-3 md:max-w-[18rem] md:shrink-0 md:items-center">
        <Avatar
          label={deskName}
          size="lg"
          className="ring-2 ring-[var(--line)] ring-offset-2 ring-offset-[var(--surface-elevated)]"
        />
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <ViewTransition
              name={`order-desk-${order.id}`}
              share="morph"
              default="none"
            >
              <h2 className="truncate text-[0.9375rem] font-semibold tracking-tight text-[var(--foreground)]">
                {deskName}
              </h2>
            </ViewTransition>
            <span className="md:hidden">
              <CardArrowIcon />
            </span>
          </div>
          <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
            <OrderTag tone={isMaker ? 'sell' : 'buy'}>
              {viewerRoleLabel(isMaker)}
            </OrderTag>
            <OrderTag tone={tagTone}>{action}</OrderTag>
            <OrderTag tone="fiat">
              {formatFiatBadge(order.quote.fiat_currency)}
            </OrderTag>
          </div>
        </div>
      </div>

      <div className="mt-4 grid min-w-0 flex-1 gap-3 md:mt-0 md:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)_auto] md:items-center md:gap-6">
        <div className="min-w-0">
          <p className="text-[0.625rem] font-medium uppercase tracking-[0.14em] text-[var(--foreground-tertiary)]">
            Size
          </p>
          <p className="mt-1 truncate text-[1.5rem] font-semibold leading-none tracking-tight tabular-nums text-[var(--foreground)]">
            {usdcLabel}
          </p>
          <p className="mt-1 truncate text-xs tabular-nums text-[var(--foreground-secondary)]">
            {fiatLabel}
          </p>
        </div>
        <div className="min-w-0">
          <p className="text-[0.625rem] font-medium uppercase tracking-[0.14em] text-[var(--foreground-tertiary)]">
            Status
          </p>
          <p className="mt-1">
            <OrderTag tone={statusTone}>
              {statusLabel}
            </OrderTag>
          </p>
          <p className="mt-1.5 text-xs text-[var(--foreground-tertiary)] tabular-nums">
            {formatOrderDate(order.created_at)}
          </p>
        </div>
        <span className="hidden items-center gap-2 text-sm font-medium text-[var(--accent)] md:inline-flex">
          Open Order
          <CardArrowIcon />
        </span>
      </div>
    </NavLink>
  );
});
