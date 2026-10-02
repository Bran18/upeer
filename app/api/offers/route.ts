import { NextResponse } from 'next/server';
import { z } from 'zod';
import {
  isSessionError,
  requireSession,
} from '@/lib/auth/require-session';
import { getSupabaseAdmin, isSupabaseConfigured } from '@/lib/supabase/server';

const createSchema = z.object({
  side: z.enum(['sell_usdc', 'buy_usdc']),
  fiatCurrency: z.string().min(3).max(8),
  spreadBps: z.number().int().min(0).max(5000),
  minUsdc: z.string(),
  maxUsdc: z.string(),
  availableUsdc: z.string(),
});

export async function GET(request: Request) {
  if (!isSupabaseConfigured()) {
    return NextResponse.json({ offers: [] });
  }

  const session = await requireSession(request);
  if (isSessionError(session)) {
    return session;
  }

  const supabase = getSupabaseAdmin();
  const merchant = await supabase
    .from('merchants')
    .select('id')
    .eq('profile_id', session.profileId)
    .maybeSingle();

  if (!merchant.data) {
    return NextResponse.json({ offers: [] });
  }

  const { data, error } = await supabase
    .from('offers')
    .select('*')
    .eq('merchant_id', merchant.data.id)
    .order('created_at', { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ offers: data ?? [] });
}

export async function POST(req: Request) {
  if (!isSupabaseConfigured()) {
    return NextResponse.json({ error: 'Supabase not configured' }, { status: 503 });
  }

  const session = await requireSession(req);
  if (isSessionError(session)) {
    return session;
  }

  try {
    const body = createSchema.parse(await req.json());
    const supabase = getSupabaseAdmin();

    const { data: merchant, error: merchantError } = await supabase
      .from('merchants')
      .select('id, status, payout_address')
      .eq('profile_id', session.profileId)
      .single();

    if (merchantError || !merchant) {
      return NextResponse.json(
        { error: 'Merchant profile not found — apply first' },
        { status: 400 },
      );
    }
    if (merchant.status !== 'approved') {
      return NextResponse.json(
        { error: 'Only approved merchants can publish offers' },
        { status: 403 },
      );
    }
    if (!merchant.payout_address) {
      return NextResponse.json(
        { error: 'Set payout_address before publishing offers' },
        { status: 400 },
      );
    }

    const { data, error } = await supabase
      .from('offers')
      .insert({
        merchant_id: merchant.id,
        side: body.side,
        fiat_currency: body.fiatCurrency.toUpperCase(),
        spread_bps: body.spreadBps,
        min_usdc: body.minUsdc,
        max_usdc: body.maxUsdc,
        available_usdc: body.availableUsdc,
        status: 'open',
      })
      .select('*')
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    return NextResponse.json(data);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : 'Create offer failed';
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
