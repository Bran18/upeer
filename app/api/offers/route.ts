import { NextResponse } from 'next/server';
import { z } from 'zod';
import {
  isSessionError,
  requireSession,
  sessionProfileId,
} from '@/lib/auth/require-session';
import { updateProfilePayoutAddress } from '@/lib/db/profiles';
import { isSupportedFiatCurrency } from '@/lib/fiat/coverage';
import { getSupabaseAdmin, isSupabaseConfigured } from '@/lib/supabase/server';

const createSchema = z.object({
  side: z.enum(['sell_usdc', 'buy_usdc']),
  fiatCurrency: z
    .string()
    .min(3)
    .max(4)
    .refine((c) => isSupportedFiatCurrency(c), {
      message: 'fiatCurrency must be CRC, ARS, BOB, CLP, or COP',
    }),
  pricePerUsdc: z.union([z.string(), z.number()]),
  minUsdc: z.string(),
  maxUsdc: z.string(),
  availableUsdc: z.string(),
  payoutAddress: z.string().optional(),
});

export async function GET() {
  if (!isSupabaseConfigured()) {
    return NextResponse.json({ offers: [] });
  }

  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from('offers')
    .select(
      `
      id,
      side,
      fiat_currency,
      price_per_usdc,
      min_usdc,
      max_usdc,
      available_usdc,
      status,
      maker_profile_id,
      profiles:maker_profile_id ( display_name )
    `,
    )
    .eq('status', 'open')
    .not('maker_profile_id', 'is', null)
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
  const profileId = sessionProfileId(session);

  try {
    const body = createSchema.parse(await req.json());
    const price = Number(body.pricePerUsdc);
    if (!Number.isFinite(price) || price <= 0) {
      return NextResponse.json({ error: 'Invalid price per USDC' }, { status: 400 });
    }

    const supabase = getSupabaseAdmin();

    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('id, payout_address, display_name')
      .eq('id', profileId)
      .single();

    if (profileError || !profile) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 400 });
    }

    let payout = profile.payout_address as string | null;
    if (body.payoutAddress?.trim()) {
      await updateProfilePayoutAddress(profileId, body.payoutAddress.trim());
      payout = body.payoutAddress.trim();
    }

    if (!payout) {
      return NextResponse.json(
        { error: 'Set your Stellar payout address before posting an order' },
        { status: 400 },
      );
    }

    const { data, error } = await supabase
      .from('offers')
      .insert({
        maker_profile_id: profileId,
        side: body.side,
        fiat_currency: body.fiatCurrency.toUpperCase(),
        price_per_usdc: price,
        spread_bps: 0,
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
