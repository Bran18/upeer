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
  const { data, error } = await supabase
    .from('merchants')
    .select('id, status, display_name, payout_address, created_at')
    .eq('profile_id', session.profileId)
    .maybeSingle();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ merchant: data });
}
