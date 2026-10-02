import { NextResponse } from 'next/server';
import { z } from 'zod';
import {
  isSessionError,
  requireSession,
} from '@/lib/auth/require-session';
import { buildExecutableQuote } from '@/lib/quotes/build-quote';
import { getSupabaseAdmin, isSupabaseConfigured } from '@/lib/supabase/server';

const bodySchema = z.object({
  offerId: z.string().uuid(),
  usdcAmount: z.string(),
});

export async function POST(req: Request) {
  if (!isSupabaseConfigured()) {
    return NextResponse.json({ error: 'Supabase not configured' }, { status: 503 });
  }

  const session = await requireSession(req);
  if (isSessionError(session)) {
    return session;
  }

  try {
    const { offerId, usdcAmount } = bodySchema.parse(await req.json());
    const supabase = getSupabaseAdmin();

    const { data: offer, error: offerError } = await supabase
      .from('offers')
      .select(
        `
        id,
        side,
        fiat_currency,
        spread_bps,
        min_usdc,
        max_usdc,
        available_usdc,
        status,
        merchants!inner (status)
      `,
      )
      .eq('id', offerId)
      .eq('status', 'open')
      .single();

    if (offerError || !offer) {
      return NextResponse.json({ error: 'Offer not found' }, { status: 404 });
    }

    const merchant = offer.merchants as { status: string } | { status: string }[];
    const merchantStatus = Array.isArray(merchant)
      ? merchant[0]?.status
      : merchant.status;
    if (merchantStatus !== 'approved') {
      return NextResponse.json({ error: 'Merchant not approved' }, { status: 400 });
    }

    const usdc = Number(usdcAmount);
    const min = Number(offer.min_usdc);
    const max = Number(offer.max_usdc);
    const available = Number(offer.available_usdc);
    if (usdc < min || usdc > max) {
      return NextResponse.json(
        { error: `Amount must be between ${min} and ${max} USDC` },
        { status: 400 },
      );
    }
    if (usdc > available) {
      return NextResponse.json({ error: 'Insufficient merchant liquidity' }, {
        status: 400,
      });
    }

    const built = await buildExecutableQuote({
      fiatCurrency: offer.fiat_currency,
      spreadBps: offer.spread_bps,
      usdcAmount,
    });

    const { data: quote, error } = await supabase
      .from('quotes')
      .insert({
        offer_id: offerId,
        buyer_profile_id: session.profileId,
        usdc_amount: built.usdcAmount,
        fiat_amount: built.fiatAmount,
        fiat_currency: built.fiatCurrency,
        reflector_snapshot: built.reflectorSnapshot,
        spread_bps: built.spreadBps,
        expires_at: built.expiresAt,
      })
      .select('*')
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({
      quote,
      preview: built,
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : 'Quote creation failed';
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
