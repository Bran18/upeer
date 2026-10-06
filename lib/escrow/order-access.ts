import { getSupabaseAdmin } from '@/lib/supabase/server';
import { p2pLegs } from '@/lib/escrow/p2p-legs';
import {
  normalizeSettlementAsset,
  type SettlementAsset,
} from '@/lib/settlement/assets';

export type OrderEscrowContext = {
  orderId: string;
  status: string;
  engagementId: string;
  side: 'sell_usdc' | 'buy_usdc';
  settlementAsset: SettlementAsset;
  usdcAmount: number;
  makerProfileId: string;
  takerProfileId: string;
  makerPayoutAddress: string | null;
  takerStellarAddress: string | null;
};

export async function loadOrderEscrowContext(
  orderId: string,
  profileId: string,
): Promise<OrderEscrowContext | null> {
  const supabase = getSupabaseAdmin();
  const { data: order, error } = await supabase
    .from('orders')
    .select(
      `
      id,
      status,
      engagement_id,
      maker_profile_id,
      taker_profile_id,
      quotes!inner (
        usdc_amount,
        settlement_asset,
        buyer_profile_id,
        offers!inner ( side, maker_profile_id )
      )
    `,
    )
    .eq('id', orderId)
    .single();

  if (error || !order) {
    return null;
  }

  const makerId = order.maker_profile_id as string;
  const takerId = order.taker_profile_id as string;
  if (profileId !== makerId && profileId !== takerId) {
    return null;
  }

  const rawQuotes = order.quotes;
  const quote = (Array.isArray(rawQuotes) ? rawQuotes[0] : rawQuotes) as {
    usdc_amount: string;
    settlement_asset?: string | null;
    offers: { side: string } | { side: string }[];
  };
  const offer = Array.isArray(quote.offers) ? quote.offers[0] : quote.offers;

  const [{ data: makerProfile }, { data: takerProfile }] = await Promise.all([
    supabase
      .from('profiles')
      .select('payout_address, stellar_address')
      .eq('id', makerId)
      .maybeSingle(),
    supabase
      .from('profiles')
      .select('stellar_address')
      .eq('id', takerId)
      .maybeSingle(),
  ]);

  return {
    orderId: order.id,
    status: order.status,
    engagementId: order.engagement_id,
    side: offer.side as 'sell_usdc' | 'buy_usdc',
    settlementAsset: quote.settlement_asset
      ? normalizeSettlementAsset(String(quote.settlement_asset))
      : 'USDC',
    usdcAmount: Number(quote.usdc_amount),
    makerProfileId: makerId,
    takerProfileId: takerId,
    makerPayoutAddress: makerProfile?.payout_address ?? null,
    takerStellarAddress: takerProfile?.stellar_address ?? null,
  };
}

export type EscrowSignerPhase =
  | 'deploy'
  | 'fund'
  | 'approve'
  | 'release'
  | 'dispute';

export function assertEscrowSigner(
  ctx: OrderEscrowContext,
  profileId: string,
  signerAddress: string,
  phase: EscrowSignerPhase,
): void {
  const legs = p2pLegs(ctx);

  if (phase === 'dispute') {
    const isSeller = profileId === legs.usdcSellerProfileId;
    const isBuyer = profileId === legs.usdcBuyerProfileId;
    if (!isSeller && !isBuyer) {
      throw new Error('Only trade participants can open a dispute');
    }
    const expectedSigner = isSeller
      ? legs.usdcSellerAddress
      : legs.usdcBuyerAddress;
    if (!expectedSigner) {
      throw new Error('Your Stellar address is missing for this order');
    }
    if (signerAddress !== expectedSigner) {
      throw new Error('Signer must be your wallet for this order');
    }
    return;
  }

  if (profileId !== legs.usdcSellerProfileId) {
    throw new Error('Only the USDC seller can perform escrow operations');
  }

  const expectedSigner = legs.usdcSellerAddress;
  if (expectedSigner && signerAddress !== expectedSigner) {
    throw new Error('Signer must be the USDC seller wallet for this order');
  }
}
