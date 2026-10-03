import { NextResponse } from 'next/server';
import {
  isSessionError,
  requireSession,
} from '@/lib/auth/require-session';
import { getSupabaseAdmin, isSupabaseConfigured } from '@/lib/supabase/server';

export async function GET(request: Request) {
  if (!isSupabaseConfigured()) {
    return NextResponse.json({ error: 'Supabase not configured' }, { status: 503 });
  }

  const session = await requireSession(request);
  if (isSessionError(session)) {
    return session;
  }

  const supabase = getSupabaseAdmin();
  const [merchantResult, offersResult] = await Promise.all([
    supabase
      .from('merchants')
      .select('id, status, display_name, payout_address, created_at')
      .eq('profile_id', session.profileId)
      .maybeSingle(),
    supabase
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
        created_at
      `,
      )
      .eq('maker_profile_id', session.profileId)
      .order('created_at', { ascending: false }),
  ]);

  if (merchantResult.error) {
    return NextResponse.json({ error: merchantResult.error.message }, { status: 500 });
  }
  if (offersResult.error) {
    return NextResponse.json({ error: offersResult.error.message }, { status: 500 });
  }

  return NextResponse.json({
    merchant: merchantResult.data,
    offers: offersResult.data ?? [],
  });
}
