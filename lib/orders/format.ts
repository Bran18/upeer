import type { OrderStatus } from '@/lib/db/orders';

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
