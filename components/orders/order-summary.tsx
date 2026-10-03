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
  formatOrderStatus,
  orderStatusTone,
  viewerRoleLabel,
} from '@/lib/orders/format';
import { acceptanceDeadline } from '@/lib/quotes/ttl';
import { Avatar } from '@/components/ui/avatar';
import { getStellarNetworkClient } from '@/lib/config/network-client';
import type { EscrowOnChainSnapshot } from '@/lib/escrow/on-chain';
import { EscrowStatus } from '@/components/escrow-status';

type Props = {
  order: OrderDetail;
  isMaker: boolean;
  escrowOnChain?: EscrowOnChainSnapshot | null;
  escrowStatusError?: string | null;
};

const STEPS = [
  {
    id: 'request',
    title: 'Request',
    body: 'The taker locked a size at the posted price.',
  },
  {
    id: 'accept',
    title: 'Accept',
    body: 'The desk accepts or declines the take.',
  },
  {
    id: 'escrow',
    title: 'Escrow',
    body: 'USDC moves through Trustless Work on Stellar.',
  },
  {
    id: 'fiat',
    title: 'Fiat',
    body: 'Local currency settles peer to peer, then both sides confirm.',
  },
  {
    id: 'release',
    title: 'Release',
    body: 'Escrow releases USDC after fiat is confirmed.',
  },
] as const;

function currentStepIndex(order: OrderDetail): number {
  switch (order.status) {
    case 'pending_acceptance':
      return 1;
    case 'declined':
    case 'cancelled':
      return 1;
    case 'created':
    case 'reserved':
    case 'escrow_pending':
      return 2;
    case 'fiat_pending':
      return 3;
    case 'released':
      return 4;
    default:
      return 0;
  }
}

export function OrderSummary({
  order,
  isMaker,
  escrowOnChain = null,
  escrowStatusError = null,
}: Props) {
  const action = buyerActionLabel(order.offer.side);
  const deskName = order.offer.maker_display_name?.trim() || 'Desk';
  const price =
    (order.quote.reflector_snapshot?.pricePerUsdc as string) ??
    order.offer.price_per_usdc;
  const stepIndex = currentStepIndex(order);
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
          label={deskName}
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
              {deskName}
            </p>
          </ViewTransition>
          <p className="mt-1 text-sm text-[var(--foreground-secondary)]">
            <span className={`offer-tag offer-tag--${statusTone}`}>
              {formatOrderStatus(order.status)}
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

      <ol className="mt-6 space-y-3 border-t border-[var(--line)] pt-5">
        {STEPS.map((step, index) => {
          const current = index === stepIndex;
          const passed = index < stepIndex;
          return (
            <li key={step.id} className="min-w-0">
              <p
                className={`text-sm font-medium ${
                  current
                    ? 'text-[var(--foreground)]'
                    : passed
                      ? 'text-[var(--foreground-secondary)]'
                      : 'text-[var(--foreground-tertiary)]'
                }`}
              >
                {index + 1}. {step.title}
                {current ? ' · Now' : ''}
              </p>
              <p className="mt-0.5 text-sm leading-relaxed text-[var(--foreground-secondary)] text-pretty">
                {step.body}
              </p>
            </li>
          );
        })}
      </ol>

      <div className="mt-6">
        <EscrowStatus
          state={
            order.status === 'released'
              ? 'released'
              : order.escrow?.tw_contract_id
                ? (order.escrow.milestone_state ?? 'escrow_pending')
                : 'idle'
          }
          contractId={order.escrow?.tw_contract_id}
          network={getStellarNetworkClient()}
          expectedUsdc={order.quote.usdc_amount}
          onChain={escrowOnChain}
          milestoneState={order.escrow?.milestone_state}
          statusError={escrowStatusError}
        />
      </div>
    </aside>
  );
}
