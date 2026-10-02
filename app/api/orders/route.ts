import { NextResponse } from 'next/server';
import { z } from 'zod';
import {
  isSessionError,
  requireSession,
} from '@/lib/auth/require-session';
import { getSupabaseAdmin, isSupabaseConfigured } from '@/lib/supabase/server';

const bodySchema = z.object({
  quoteId: z.string().uuid(),
});

export async function POST(req: Request) {
  if (!isSupabaseConfigured()) {
    return NextResponse.json({ error: 'Supabase not configured' }, { status: 503 });
  }

  const session = await requireSession();
  if (isSessionError(session)) {
    return session;
  }

  try {
    const { quoteId } = bodySchema.parse(await req.json());
    const supabase = getSupabaseAdmin();

    const { data: quote, error: quoteError } = await supabase
      .from('quotes')
      .select('*, offers!inner(id, available_usdc, merchant_id)')
      .eq('id', quoteId)
      .eq('buyer_profile_id', session.profileId)
      .single();

    if (quoteError || !quote) {
      return NextResponse.json({ error: 'Quote not found' }, { status: 404 });
    }

    if (new Date(quote.expires_at).getTime() <= Date.now()) {
      return NextResponse.json({ error: 'Quote expired' }, { status: 400 });
    }

    const offer = quote.offers as {
      id: string;
      available_usdc: string;
      merchant_id: string;
    };

    const usdc = Number(quote.usdc_amount);
    const available = Number(offer.available_usdc);
    if (usdc > available) {
      return NextResponse.json({ error: 'Insufficient liquidity' }, { status: 409 });
    }

    const { data: order, error: orderError } = await supabase
      .from('orders')
      .insert({
        quote_id: quoteId,
        status: 'reserved',
        engagement_id: crypto.randomUUID(),
      })
      .select('*')
      .single();

    if (orderError) {
      return NextResponse.json({ error: orderError.message }, { status: 400 });
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
      await supabase.from('orders').delete().eq('id', order.id);
      return NextResponse.json({ error: 'Liquidity conflict' }, { status: 409 });
    }

    await supabase.from('escrow_sessions').insert({
      order_id: order.id,
      milestone_state: 'idle',
    });

    const { data: merchant } = await supabase
      .from('merchants')
      .select('payout_address, display_name')
      .eq('id', offer.merchant_id)
      .single();

    return NextResponse.json({
      order,
      merchant,
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : 'Order creation failed';
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
