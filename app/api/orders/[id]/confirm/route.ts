import { NextResponse } from 'next/server';
import { z } from 'zod';
import {
  isSessionError,
  requireSession,
} from '@/lib/auth/require-session';
import { createNotification } from '@/lib/db/notifications';
import type { FiatConfirmation } from '@/lib/db/orders';
import { p2pLegs } from '@/lib/escrow/p2p-legs';
import { getSupabaseAdmin, isSupabaseConfigured } from '@/lib/supabase/server';

const bodySchema = z.object({
  step: z.enum(['fiat_sent', 'fiat_received']),
});

type Params = { params: Promise<{ id: string }> };

export async function POST(req: Request, { params }: Params) {
  if (!isSupabaseConfigured()) {
    return NextResponse.json({ error: 'Supabase not configured' }, { status: 503 });
  }

  const session = await requireSession(req);
  if (isSessionError(session)) {
    return session;
  }

  const { id } = await params;
  const { step } = bodySchema.parse(await req.json());
  const supabase = getSupabaseAdmin();

  const { data: order, error } = await supabase
    .from('orders')
    .select(
      `
      id,
      maker_profile_id,
      taker_profile_id,
      fiat_confirmation,
      status,
      quotes!inner (
        offers!inner ( side )
      )
    `,
    )
    .eq('id', id)
    .single();

  if (error || !order) {
    return NextResponse.json({ error: 'Order not found' }, { status: 404 });
  }

  const makerId = order.maker_profile_id as string;
  const takerId = order.taker_profile_id as string;
  const profileId = session.profileId;
  if (profileId !== makerId && profileId !== takerId) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const rawQuotes = order.quotes;
  const quote = (Array.isArray(rawQuotes) ? rawQuotes[0] : rawQuotes) as {
    offers: { side: string } | { side: string }[];
  };
  const offer = Array.isArray(quote.offers) ? quote.offers[0] : quote.offers;
  const legs = p2pLegs({
    side: offer.side as 'sell_usdc' | 'buy_usdc',
    makerProfileId: makerId,
    takerProfileId: takerId,
    makerPayoutAddress: null,
    takerStellarAddress: null,
  });

  if (step === 'fiat_sent' && profileId !== legs.usdcBuyerProfileId) {
    return NextResponse.json(
      { error: 'Only the USDC buyer can confirm fiat sent' },
      { status: 403 },
    );
  }
  if (step === 'fiat_received' && profileId !== legs.usdcSellerProfileId) {
    return NextResponse.json(
      { error: 'Only the USDC seller can confirm fiat received' },
      { status: 403 },
    );
  }

  const confirmation = (order.fiat_confirmation ?? {}) as FiatConfirmation;
  const now = new Date().toISOString();
  if (step === 'fiat_sent') {
    if (confirmation.takerPaidAt) {
      return NextResponse.json(
        { error: 'Fiat sent was already confirmed for this order' },
        { status: 409 },
      );
    }
    confirmation.takerPaidAt = now;
  } else {
    if (!confirmation.takerPaidAt) {
      return NextResponse.json(
        {
          error:
            'The USDC buyer must mark fiat sent before you can confirm receipt',
        },
        { status: 400 },
      );
    }
    if (confirmation.makerReceivedAt) {
      return NextResponse.json(
        { error: 'Fiat received was already confirmed for this order' },
        { status: 409 },
      );
    }
    confirmation.makerReceivedAt = now;
  }

  const nextStatus =
    step === 'fiat_received' && order.status === 'escrow_pending'
      ? 'fiat_pending'
      : order.status;

  const { data: updated, error: updateError } = await supabase
    .from('orders')
    .update({
      fiat_confirmation: confirmation,
      status: nextStatus,
      updated_at: now,
    })
    .eq('id', id)
    .select('*')
    .single();

  if (updateError) {
    return NextResponse.json({ error: updateError.message }, { status: 400 });
  }

  const notifyId =
    step === 'fiat_sent'
      ? legs.usdcSellerProfileId
      : legs.usdcBuyerProfileId;
  if (notifyId) {
    await createNotification({
      profileId: notifyId,
      type: step === 'fiat_sent' ? 'fiat_sent' : 'fiat_received',
      title:
        step === 'fiat_sent' ? 'Fiat marked sent' : 'Fiat marked received',
      body:
        step === 'fiat_sent'
          ? 'Counterparty marked the fiat leg as sent.'
          : 'USDC seller confirmed fiat received.',
      href: `/orders/${id}`,
      metadata: { orderId: id, step },
    });
  }

  return NextResponse.json({ order: updated, fiat_confirmation: confirmation });
}
