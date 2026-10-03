import { NextResponse } from 'next/server';
import {
  isSessionError,
  requireSession,
} from '@/lib/auth/require-session';
import { createNotification } from '@/lib/db/notifications';
import { getSupabaseAdmin, isSupabaseConfigured } from '@/lib/supabase/server';

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
  const supabase = getSupabaseAdmin();

  const { data: order, error } = await supabase
    .from('orders')
    .select(
      `
      id,
      status,
      maker_profile_id,
      taker_profile_id,
      quotes!inner (
        usdc_amount,
        expires_at,
        offers!inner ( id, available_usdc )
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

  if (order.status !== 'pending_acceptance') {
    return NextResponse.json(
      { error: `Order is not awaiting acceptance (${order.status})` },
      { status: 400 },
    );
  }

  const rawQuote = order.quotes;
  const quote = (Array.isArray(rawQuote) ? rawQuote[0] : rawQuote) as {
    usdc_amount: string;
    expires_at: string;
    offers: { id: string; available_usdc: string } | { id: string; available_usdc: string }[];
  };

  if (new Date(quote.expires_at).getTime() <= Date.now()) {
    await supabase
      .from('orders')
      .update({ status: 'cancelled', updated_at: new Date().toISOString() })
      .eq('id', id);
    return NextResponse.json({ error: 'Quote expired' }, { status: 400 });
  }

  const offer = Array.isArray(quote.offers) ? quote.offers[0] : quote.offers;
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
