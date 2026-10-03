import { NextResponse } from 'next/server';
import { z } from 'zod';
import {
  isSessionError,
  requireSession,
} from '@/lib/auth/require-session';
import {
  resolveSellerPaymentMethod,
  usdcSellerProfileId,
} from '@/lib/orders/fiat-settlement';
import { createNotification } from '@/lib/db/notifications';
import { orderCanBeAccepted } from '@/lib/quotes/ttl';
import { getSupabaseAdmin, isSupabaseConfigured } from '@/lib/supabase/server';

type Params = { params: Promise<{ id: string }> };

const bodySchema = z.object({
  paymentMethodId: z.string().min(8).max(64).optional(),
});

export async function POST(req: Request, { params }: Params) {
  if (!isSupabaseConfigured()) {
    return NextResponse.json({ error: 'Supabase not configured' }, { status: 503 });
  }

  const session = await requireSession(req);
  if (isSessionError(session)) {
    return session;
  }

  const { id } = await params;
  const body = bodySchema.safeParse(
    await req.json().catch(() => ({})),
  );
  const paymentMethodId = body.success ? body.data.paymentMethodId : undefined;
  const supabase = getSupabaseAdmin();

  const { data: order, error } = await supabase
    .from('orders')
    .select(
      `
      id,
      status,
      created_at,
      maker_profile_id,
      taker_profile_id,
      fiat_settlement,
      quotes!inner (
        usdc_amount,
        fiat_currency,
        expires_at,
        offers!inner ( id, available_usdc, side )
      )
    `,
    )
    .eq('id', id)
    .single();

  if (error || !order) {
    return NextResponse.json({ error: 'Order not found' }, { status: 404 });
  }

  if (order.maker_profile_id !== session.profileId) {
    return NextResponse.json({ error: 'Only the maker can accept' }, { status: 403 });
  }

  const rawQuote = order.quotes;
  const quote = (Array.isArray(rawQuote) ? rawQuote[0] : rawQuote) as {
    usdc_amount: string;
    fiat_currency: string;
    expires_at: string;
    offers:
      | { id: string; available_usdc: string; side: 'sell_usdc' | 'buy_usdc' }
      | { id: string; available_usdc: string; side: 'sell_usdc' | 'buy_usdc' }[];
  };

  if (!orderCanBeAccepted(order.status, order.created_at, quote.expires_at)) {
    if (order.status !== 'pending_acceptance' && order.status !== 'cancelled') {
      return NextResponse.json(
        { error: `Order is not awaiting acceptance (${order.status})` },
        { status: 400 },
      );
    }
    if (order.status === 'pending_acceptance') {
      await supabase
        .from('orders')
        .update({ status: 'cancelled', updated_at: new Date().toISOString() })
        .eq('id', id);
    }
    return NextResponse.json(
      {
        error:
          'This take expired. Ask the taker to request the trade again.',
      },
      { status: 400 },
    );
  }

  const offer = Array.isArray(quote.offers) ? quote.offers[0] : quote.offers;
  const makerId = order.maker_profile_id as string;
  const takerId = order.taker_profile_id as string;
  const sellerId = usdcSellerProfileId(offer.side, makerId, takerId);

  let fiatSettlement = order.fiat_settlement as Record<string, unknown> | null;
  if (offer.side === 'sell_usdc') {
    if (!paymentMethodId) {
      return NextResponse.json(
        {
          error:
            'Choose how you receive fiat for this trade before accepting.',
        },
        { status: 400 },
      );
    }
    const { data: sellerProfile, error: sellerError } = await supabase
      .from('profiles')
      .select('payment_prefs')
      .eq('id', sellerId)
      .single();
    if (sellerError || !sellerProfile) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 });
    }
    try {
      fiatSettlement = resolveSellerPaymentMethod(
        sellerProfile.payment_prefs,
        paymentMethodId,
        String(quote.fiat_currency),
        sellerId,
      );
    } catch (e: unknown) {
      const message =
        e instanceof Error ? e.message : 'Invalid payment method';
      return NextResponse.json({ error: message }, { status: 400 });
    }
  } else if (!fiatSettlement) {
    return NextResponse.json(
      {
        error:
          'This trade is missing a fiat account. Ask the taker to request again.',
      },
      { status: 400 },
    );
  }

  const usdc = Number(quote.usdc_amount);
  const available = Number(offer.available_usdc);
  if (usdc > available) {
    return NextResponse.json({ error: 'Insufficient liquidity' }, { status: 409 });
  }

  const newAvailable = (available - usdc).toFixed(7);
  const { error: liquidityError } = await supabase
    .from('offers')
    .update({
      available_usdc: newAvailable,
      updated_at: new Date().toISOString(),
    })
    .eq('id', offer.id)
    .gte('available_usdc', quote.usdc_amount);

  if (liquidityError) {
    return NextResponse.json({ error: 'Liquidity conflict' }, { status: 409 });
  }

  const { data: updated, error: updateError } = await supabase
    .from('orders')
    .update({
      status: 'reserved',
      fiat_settlement: fiatSettlement,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)
    .select('*')
    .single();

  if (updateError) {
    return NextResponse.json({ error: updateError.message }, { status: 400 });
  }

  if (order.taker_profile_id) {
    await createNotification({
      profileId: order.taker_profile_id,
      type: 'order_accepted',
      title: 'Trade accepted',
      body: 'Your counterparty accepted the trade. Continue with escrow.',
      href: `/orders/${id}`,
      metadata: { orderId: id },
    });
  }

  return NextResponse.json({ order: updated });
}
