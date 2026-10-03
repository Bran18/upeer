import { getSupabaseAdmin } from '@/lib/supabase/server';

export type OrderStatus =
  | 'pending_acceptance'
  | 'declined'
  | 'created'
  | 'reserved'
  | 'escrow_pending'
  | 'fiat_pending'
  | 'released'
  | 'cancelled'
  | 'disputed';

export type FiatConfirmation = {
  takerPaidAt?: string;
  makerReceivedAt?: string;
};

export type OrderDetail = {
  id: string;
  status: OrderStatus;
  engagement_id: string;
  maker_profile_id: string | null;
  taker_profile_id: string | null;
  fiat_confirmation: FiatConfirmation;
  created_at: string;
  updated_at: string;
  quote: {
    id: string;
    usdc_amount: string;
    fiat_amount: string;
    fiat_currency: string;
    expires_at: string;
    spread_bps: number;
    reflector_snapshot: Record<string, unknown>;
  };
  offer: {
    id: string;
    side: 'sell_usdc' | 'buy_usdc';
    fiat_currency: string;
    price_per_usdc: string;
    maker_display_name: string | null;
  };
  escrow: {
    tw_contract_id: string | null;
    milestone_state: string;
    last_error: string | null;
  } | null;
};

export async function getOrderDetailForParticipant(
  orderId: string,
  profileId: string,
  isOperator = false,
): Promise<OrderDetail | null> {
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
      fiat_confirmation,
      created_at,
      updated_at,
      quotes!inner (
        id,
        usdc_amount,
        fiat_amount,
        fiat_currency,
        expires_at,
        spread_bps,
        reflector_snapshot,
        offers!inner (
          id,
          side,
          fiat_currency,
          price_per_usdc,
          maker_profile_id
        )
      ),
      escrow_sessions (
        tw_contract_id,
        milestone_state,
        last_error
      )
    `,
    )
    .eq('id', orderId)
    .maybeSingle();

  if (error || !order) {
    return null;
  }

  const makerId = order.maker_profile_id as string | null;
  const takerId = order.taker_profile_id as string | null;
  if (
    !isOperator &&
    profileId !== makerId &&
    profileId !== takerId
  ) {
    return null;
  }

  const rawQuotes = order.quotes;
  const quote = (Array.isArray(rawQuotes) ? rawQuotes[0] : rawQuotes) as
    | {
        id: string;
        usdc_amount: string;
        fiat_amount: string;
        fiat_currency: string;
        expires_at: string;
        spread_bps: number;
        reflector_snapshot: Record<string, unknown>;
        offers: unknown;
      }
    | undefined;

  if (!quote) {
    return null;
  }

  const rawOffers = quote.offers;
  const offerRow = (Array.isArray(rawOffers) ? rawOffers[0] : rawOffers) as
    | {
        id: string;
        side: string;
        fiat_currency: string;
        price_per_usdc: string;
        maker_profile_id: string;
      }
    | undefined;

  if (!offerRow) {
    return null;
  }

  const { data: makerProfile } = await supabase
    .from('profiles')
    .select('display_name')
    .eq('id', offerRow.maker_profile_id)
    .maybeSingle();

  const rawEscrow = order.escrow_sessions;
  const escrowRow = Array.isArray(rawEscrow) ? rawEscrow[0] : rawEscrow;

  return {
    id: order.id,
    status: order.status as OrderStatus,
    engagement_id: order.engagement_id,
    maker_profile_id: makerId,
    taker_profile_id: takerId,
    fiat_confirmation: (order.fiat_confirmation ?? {}) as FiatConfirmation,
    created_at: order.created_at,
    updated_at: order.updated_at,
    quote: {
      id: quote.id,
      usdc_amount: String(quote.usdc_amount),
      fiat_amount: String(quote.fiat_amount),
      fiat_currency: quote.fiat_currency,
      expires_at: quote.expires_at,
      spread_bps: quote.spread_bps,
      reflector_snapshot: quote.reflector_snapshot,
    },
    offer: {
      id: offerRow.id,
      side: offerRow.side as 'sell_usdc' | 'buy_usdc',
      fiat_currency: offerRow.fiat_currency,
      price_per_usdc: String(offerRow.price_per_usdc),
      maker_display_name: makerProfile?.display_name ?? null,
    },
    escrow: escrowRow
      ? {
          tw_contract_id: escrowRow.tw_contract_id,
          milestone_state: escrowRow.milestone_state,
          last_error: escrowRow.last_error,
        }
      : null,
  };
}

export async function listOrdersForProfile(
  profileId: string,
  role: 'incoming' | 'outgoing' | 'all',
): Promise<OrderDetail[]> {
  const supabase = getSupabaseAdmin();
  let query = supabase
    .from('orders')
    .select('id')
    .order('created_at', { ascending: false })
    .limit(50);

  if (role === 'incoming') {
    query = query.eq('maker_profile_id', profileId);
  } else if (role === 'outgoing') {
    query = query.eq('taker_profile_id', profileId);
  } else {
    query = query.or(
      `maker_profile_id.eq.${profileId},taker_profile_id.eq.${profileId}`,
    );
  }

  const { data, error } = await query;
  if (error || !data?.length) {
    return [];
  }

  const details: OrderDetail[] = [];
  for (const row of data) {
    const detail = await getOrderDetailForParticipant(row.id, profileId);
    if (detail) {
      details.push(detail);
    }
  }
  return details;
}
