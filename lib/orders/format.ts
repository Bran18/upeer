import type { FiatConfirmation, OrderStatus } from '@/lib/db/orders';

export const ACTIVE_ORDER_STATUSES: readonly OrderStatus[] = [
  'pending_acceptance',
  'created',
  'reserved',
  'escrow_pending',
  'fiat_pending',
];

export type OrderStatusTone = 'pending' | 'live' | 'done' | 'danger';

export function formatOrderStatus(status: OrderStatus): string {
  switch (status) {
    case 'pending_acceptance':
      return 'Awaiting Acceptance';
    case 'declined':
      return 'Declined';
    case 'created':
      return 'Created';
    case 'reserved':
      return 'Reserved';
    case 'escrow_pending':
      return 'Escrow Pending';
    case 'fiat_pending':
      return 'Fiat Pending';
    case 'released':
      return 'Released';
    case 'cancelled':
      return 'Cancelled';
    case 'disputed':
      return 'Disputed';
    default:
      return status;
  }
}

type OrderProgressInput = {
  status: OrderStatus;
  escrow?: { milestone_state: string } | null;
  fiat_confirmation?: FiatConfirmation;
};

/** User-facing progress: escrow DB status stays `escrow_pending` after fund. */
export function formatOrderProgress(order: OrderProgressInput): string {
  if (
    order.status === 'pending_acceptance' ||
    order.status === 'declined' ||
    order.status === 'cancelled' ||
    order.status === 'released' ||
    order.status === 'disputed'
  ) {
    return formatOrderStatus(order.status);
  }

  const milestone = order.escrow?.milestone_state ?? '';
  const fiat = order.fiat_confirmation ?? {};

  if (order.status === 'fiat_pending' || fiat.makerReceivedAt) {
    return 'Fiat Pending';
  }
  if (fiat.takerPaidAt) {
    return 'Fiat Sent';
  }
  if (milestone === 'funded') {
    return 'Escrow Funded';
  }
  if (milestone === 'fund_submitted' || milestone === 'fund_unsigned') {
    return 'Funding Escrow';
  }
  if (milestone === 'deploy_submitted' || milestone === 'deploy_unsigned') {
    return 'Awaiting Fund';
  }
  return formatOrderStatus(order.status);
}

export function orderStatusTone(status: OrderStatus): OrderStatusTone {
  if (status === 'released') {
    return 'done';
  }
  if (status === 'declined' || status === 'cancelled' || status === 'disputed') {
    return 'danger';
  }
  if (status === 'pending_acceptance' || status === 'created') {
    return 'pending';
  }
  return 'live';
}

export function isActiveOrderStatus(status: OrderStatus): boolean {
  return ACTIVE_ORDER_STATUSES.includes(status);
}

export function formatOrderDate(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) {
    return '—';
  }
  return new Intl.DateTimeFormat('en-US', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(date);
}

export function viewerRoleLabel(isMaker: boolean): string {
  return isMaker ? 'Incoming' : 'Outgoing';
}
