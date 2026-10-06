import type { OrderDetail } from '@/lib/db/orders';
import { preferMilestoneState } from '@/lib/escrow/funding-state';
import { p2pLegs } from '@/lib/escrow/p2p-legs';

export function mergeOrderDetail(
  prev: OrderDetail | null,
  next: OrderDetail,
): OrderDetail {
  if (!prev) {
    return next;
  }
  const prevEscrow = prev.escrow;
  const nextEscrow = next.escrow;
  if (!prevEscrow && !nextEscrow) {
    return next;
  }
  return {
    ...next,
    escrow: {
      tw_contract_id:
        nextEscrow?.tw_contract_id ?? prevEscrow?.tw_contract_id ?? null,
      last_error: nextEscrow?.last_error ?? prevEscrow?.last_error ?? null,
      milestone_state: preferMilestoneState(
        prevEscrow?.milestone_state ?? 'idle',
        nextEscrow?.milestone_state ?? 'idle',
      ),
    },
  };
}

export function nextStepCopy(
  order: OrderDetail,
  profileId: string | null,
  isMaker: boolean,
  isTaker: boolean,
  canAccept: boolean,
): string {
  const legs =
    profileId && order.maker_profile_id && order.taker_profile_id
      ? p2pLegs({
          side: order.offer.side,
          makerProfileId: order.maker_profile_id,
          takerProfileId: order.taker_profile_id,
          makerPayoutAddress: null,
          takerStellarAddress: null,
        })
      : null;
  const isSeller =
    legs && profileId ? legs.usdcSellerProfileId === profileId : false;
  const isBuyer =
    legs && profileId ? legs.usdcBuyerProfileId === profileId : false;
  if (canAccept && isMaker) {
    return 'Accept to lock this take on your desk, or decline to release the quote.';
  }
  if (order.status === 'pending_acceptance' && isTaker) {
    return 'Waiting for the desk to accept. You can leave this page open—it refreshes on its own.';
  }
  if (order.status === 'released') {
    return 'This trade is complete. USDC released and fiat confirmed.';
  }
  if (order.status === 'declined') {
    return 'This request was declined. Open the market to take another desk.';
  }
  if (order.status === 'cancelled') {
    return 'This take expired. Ask the taker to request the trade again.';
  }
  if (order.status === 'disputed') {
    return 'This trade is in dispute. USDC stays in escrow until UPEER resolves it.';
  }
  if (isBuyer) {
    return 'Send fiat to your counterparty when ready, then mark it sent. USDC stays in escrow until the seller releases.';
  }
  if (isSeller) {
    if (!order.fiat_confirmation.takerPaidAt) {
      return 'Deploy and fund escrow with USDC. You can confirm fiat received only after the buyer marks fiat sent.';
    }
    return 'Deploy and fund escrow with USDC, confirm when fiat arrives, then approve and release.';
  }
  if (isTaker) {
    return 'Complete fiat confirmation and wait for the USDC seller to move escrow forward.';
  }
  if (isMaker) {
    return 'Complete the next step on your side of this trade.';
  }
  return 'Follow escrow and fiat confirmation until this order is released.';
}
