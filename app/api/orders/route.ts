import { NextResponse } from 'next/server';
import { z } from 'zod';
import {
  isSessionError,
  requireSession,
  sessionProfileId,
} from '@/lib/auth/require-session';
import { createNotification } from '@/lib/db/notifications';
import { listOrdersForProfile } from '@/lib/db/orders';
import {
  resolveSellerPaymentMethod,
  usdcSellerProfileId,
} from '@/lib/orders/fiat-settlement';
import { acceptanceDeadline } from '@/lib/quotes/ttl';
import { getSupabaseAdmin, isSupabaseConfigured } from '@/lib/supabase/server';

const bodySchema = z.object({
  quoteId: z.string().uuid(),
  paymentMethodId: z.string().min(8).max(64).optional(),
});

export async function GET(req: Request) {
  if (!isSupabaseConfigured()) {
    return NextResponse.json({ orders: [] });
  }

  const session = await requireSession(req);
  if (isSessionError(session)) {
    return session;
  }
  const profileId = sessionProfileId(session);

  const url = new URL(req.url);
  const roleRaw = url.searchParams.get('role') ?? 'all';
  const role =
    roleRaw === 'incoming' || roleRaw === 'outgoing' ? roleRaw : 'all';

  try {
    const orders = await listOrdersForProfile(profileId, role);
    return NextResponse.json({ orders });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : 'Failed to list orders';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  if (!isSupabaseConfigured()) {
    return NextResponse.json({ error: 'Supabase not configured' }, { status: 503 });
  }

  const session = await requireSession(req);
  if (isSessionError(session)) {
    return session;
  }
  const profileId = sessionProfileId(session);

  try {
    const { quoteId, paymentMethodId } = bodySchema.parse(await req.json());
    const supabase = getSupabaseAdmin();

    const { data: quote, error: quoteError } = await supabase
      .from('quotes')
      .select(
        `
        id,
        usdc_amount,
        fiat_currency,
        expires_at,
        buyer_profile_id,
        offers!inner (
          id,
          available_usdc,
          maker_profile_id,
          status,
          side
        )
      `,
      )
      .eq('id', quoteId)
      .eq('buyer_profile_id', profileId)
      .single();

    if (quoteError || !quote) {
      return NextResponse.json({ error: 'Quote not found' }, { status: 404 });
    }

    if (new Date(quote.expires_at).getTime() <= Date.now()) {
      return NextResponse.json(
        {
          error:
            'This quote expired. Request the trade again from the offer.',
        },
        { status: 400 },
      );
    }

    const rawOffer = quote.offers;
    const offer = (Array.isArray(rawOffer) ? rawOffer[0] : rawOffer) as {
      id: string;
      available_usdc: string;
      maker_profile_id: string;
      status: string;
      side: 'sell_usdc' | 'buy_usdc';
    };

    if (offer.status !== 'open') {
      return NextResponse.json({ error: 'Offer is not open' }, { status: 400 });
    }

    if (offer.maker_profile_id === profileId) {
      return NextResponse.json(
        { error: 'You cannot take your own order' },
        { status: 400 },
      );
    }

    const usdc = Number(quote.usdc_amount);
    const available = Number(offer.available_usdc);
    if (usdc > available) {
      return NextResponse.json({ error: 'Insufficient liquidity' }, { status: 409 });
    }

    const fiatCurrency = String(quote.fiat_currency);
    const sellerId = usdcSellerProfileId(
      offer.side,
      offer.maker_profile_id,
      profileId,
    );

    let fiatSettlement: Record<string, unknown> | null = null;
    if (offer.side === 'buy_usdc') {
      if (!paymentMethodId) {
        return NextResponse.json(
          {
            error:
              'Choose how you receive fiat for this trade before requesting.',
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
          fiatCurrency,
          sellerId,
        );
      } catch (e: unknown) {
        const message =
          e instanceof Error ? e.message : 'Invalid payment method';
        return NextResponse.json({ error: message }, { status: 400 });
      }
    }

    const { data: order, error: orderError } = await supabase
      .from('orders')
      .insert({
        quote_id: quoteId,
        status: 'pending_acceptance',
        engagement_id: crypto.randomUUID(),
        maker_profile_id: offer.maker_profile_id,
        taker_profile_id: profileId,
        ...(fiatSettlement ? { fiat_settlement: fiatSettlement } : {}),
      })
      .select('*')
      .single();

    if (orderError) {
      return NextResponse.json({ error: orderError.message }, { status: 400 });
    }

    const acceptBy = acceptanceDeadline(
      order.created_at,
      quote.expires_at,
    ).toISOString();
    await supabase
      .from('quotes')
      .update({ expires_at: acceptBy })
      .eq('id', quoteId);

    await supabase.from('escrow_sessions').insert({
      order_id: order.id,
      milestone_state: 'idle',
    });

    await createNotification({
      profileId: offer.maker_profile_id,
      type: 'order_requested',
      title: 'New trade request',
      body: `Someone wants ${quote.usdc_amount} USDC on your order.`,
      href: `/orders/${order.id}`,
      metadata: { orderId: order.id, offerId: offer.id },
    });

    return NextResponse.json({ order });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : 'Order creation failed';
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
