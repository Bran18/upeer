import type { MerchantStatus } from '@/lib/profile/types';

export const MERCHANT_PITCH_STEPS = [
  {
    title: 'Post a price',
    body: 'List how much local currency you take or pay per 1 USDC. Takers see the number on the book.',
  },
  {
    title: 'Escrow holds USDC',
    body: 'The on-chain leg locks until fiat is confirmed. You settle local currency directly with the counterparty.',
  },
  {
    title: 'Payout to your wallet',
    body: 'When you sell USDC, escrow releases to an address you control — not a pooled exchange wallet.',
  },
] as const;

export function merchantStatusLabel(status: MerchantStatus | string): string {
  switch (status) {
    case 'approved':
    case 'pending':
      return 'Active';
    case 'rejected':
      return 'Inactive';
    case 'suspended':
      return 'Suspended';
    default:
      return 'Not listed';
  }
}

export function merchantStatusBody(status: MerchantStatus | string): string {
  switch (status) {
    case 'approved':
    case 'pending':
      return 'Your desk can post on the public book. Keep payout and payment methods current so takers can complete.';
    case 'rejected':
      return 'Update the public name if needed and list your desk again.';
    case 'suspended':
      return 'This desk cannot post until support restores it.';
    default:
      return 'Apply with a public desk name. Buyers see that name on your orders.';
  }
}
