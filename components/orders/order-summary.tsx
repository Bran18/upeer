import { ViewTransition } from 'react';
import type { OrderDetail } from '@/lib/db/orders';
import { formatFiatBadge } from '@/lib/fiat/coverage';
import {
  buyerActionLabel,
  formatFiatTotal,
  formatPricePerUsdc,
  formatUsdcLabel,
} from '@/lib/market/format';
import {
  formatOrderDate,
  formatOrderProgress,
  orderStatusTone,
  viewerRoleLabel,
} from '@/lib/orders/format';
import { acceptanceDeadline } from '@/lib/quotes/ttl';
import { Avatar } from '@/components/ui/avatar';
import { getStellarNetworkClient } from '@/lib/config/network-client';
import type { EscrowOnChainSnapshot } from '@/lib/escrow/on-chain';
import { escrowSnapshotFromOrder } from '@/lib/escrow/status-snapshot';
import { EscrowStatus } from '@/components/escrow-status';
import { OrderSettlementDetails } from '@/components/orders/order-settlement-details';

type Props = {
  order: OrderDetail;
  isMaker: boolean;
  isUsdcBuyer: boolean;
  isUsdcSeller: boolean;
  showUsdcRelease: boolean;
  escrowOnChain?: EscrowOnChainSnapshot | null;
  escrowStatusError?: string | null;
};

export function OrderSummary({
  order,
  isMaker,
  isUsdcBuyer,
  isUsdcSeller,
  showUsdcRelease,
  escrowOnChain = null,
  escrowStatusError = null,
}: Props) {
  const action = buyerActionLabel(order.offer.side);
  const counterpartyLabel =
    order.counterparty?.displayName?.trim() ||
    (isMaker ? 'Taker' : order.offer.maker_display_name?.trim() || 'Desk');
  const price =
    (order.quote.reflector_snapshot?.pricePerUsdc as string) ??
    order.offer.price_per_usdc;
  const statusTone = orderStatusTone(order.status);

  const facts = [
    {
      label: 'USDC',
      value: formatUsdcLabel(order.quote.usdc_amount),
    },
    {
      label: 'Fiat total',
      value: formatFiatTotal(
        order.quote.fiat_currency,
        Number(order.quote.fiat_amount),
      ),
    },
    {
      label: 'Price per USDC',
      value: formatPricePerUsdc(order.quote.fiat_currency, price),
    },
    {
      label: 'Market',
      value: formatFiatBadge(order.quote.fiat_currency),
    },
  ];

  if (order.status === 'pending_acceptance' || order.status === 'cancelled') {
    facts.push({
      label: 'Accept by',
      value: formatOrderDate(
        acceptanceDeadline(order.created_at, order.quote.expires_at).toISOString(),
      ),
    });
  }

  return (
    <aside className="ui-card flex flex-col px-5 py-5 sm:px-6 sm:py-6">
      <div className="flex items-start gap-3">
        <Avatar
          label={counterpartyLabel}
          src={order.counterparty?.avatarUrl ?? undefined}
          size="lg"
          className="ring-2 ring-[var(--line)] ring-offset-2 ring-offset-[var(--surface-elevated)]"
        />
        <div className="min-w-0 flex-1">
          <p className="text-[0.625rem] font-medium uppercase tracking-[0.14em] text-[var(--foreground-tertiary)]">
            {viewerRoleLabel(isMaker)} · {action}
          </p>
          <ViewTransition
            name={`order-desk-${order.id}`}
            share="morph"
            default="none"
          >
            <p className="mt-1 truncate text-lg font-semibold tracking-tight">
              {counterpartyLabel}
            </p>
          </ViewTransition>
          <p className="mt-1 text-sm text-[var(--foreground-secondary)]">
            <span className={`offer-tag offer-tag--${statusTone}`}>
              {formatOrderProgress(order)}
            </span>
            <span className="ml-2 tabular-nums text-xs text-[var(--foreground-tertiary)]">
              {formatOrderDate(order.created_at)}
            </span>
          </p>
        </div>
      </div>

      <dl className="mt-6 grid gap-3 sm:grid-cols-2">
        {facts.map((fact) => (
          <div
            key={fact.label}
            className="min-w-0 rounded-[var(--radius-ui)] border border-[var(--line)] bg-[var(--fill)] px-3 py-3"
          >
            <dt className="text-xs text-[var(--foreground-tertiary)]">
              {fact.label}
            </dt>
            <dd className="mt-1 truncate text-sm font-medium tabular-nums">
              {fact.value}
            </dd>
          </div>
        ))}
      </dl>

      <div className="mt-6 border-t border-[var(--line)] pt-5">
        <EscrowStatus
          escrow={escrowSnapshotFromOrder(order, {
            network: getStellarNetworkClient(),
            onChain: escrowOnChain,
            statusError: escrowStatusError,
          })}
        />
        {order.fiatSettlement || showUsdcRelease ? (
          <OrderSettlementDetails
            fiatSettlement={order.fiatSettlement}
            usdcReleaseAddress={order.usdcReleaseAddress}
            showUsdcRelease={showUsdcRelease}
            viewerIsUsdcBuyer={isUsdcBuyer}
            viewerIsUsdcSeller={isUsdcSeller}
          />
        ) : null}
      </div>
    </aside>
  );
}
