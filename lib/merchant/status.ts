import type { MerchantStatus } from '@/lib/profile/types';

/** Desk can post and appear on the market (no operator approval). */
export function merchantCanOperate(status: MerchantStatus | string): boolean {
  return status === 'approved' || status === 'pending';
}

export function merchantListedOnMarket(status: MerchantStatus | string): boolean {
  return merchantCanOperate(status);
}
