import { NextResponse } from 'next/server';
import {
  isSessionError,
  requireSession,
  sessionProfileId,
} from '@/lib/auth/require-session';
import { profileIsOperator } from '@/lib/db/profiles';
import { getSupabaseAdmin, isSupabaseConfigured } from '@/lib/supabase/server';

export async function GET(req: Request) {
  if (!isSupabaseConfigured()) {
    return NextResponse.json({ error: 'Supabase not configured' }, { status: 503 });
  }

  const session = await requireSession(req);
  if (isSessionError(session)) {
    return session;
  }

  const isOperator = await profileIsOperator(sessionProfileId(session));
  if (!isOperator) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const supabase = getSupabaseAdmin();
  const [merchants, orders] = await Promise.all([
    supabase
      .from('merchants')
      .select('id, display_name, status, created_at')
      .eq('status', 'pending')
      .order('created_at', { ascending: false })
      .limit(50),
    supabase
      .from('orders')
      .select('id, status, created_at, maker_profile_id, taker_profile_id')
      .order('created_at', { ascending: false })
      .limit(50),
  ]);

  return NextResponse.json({
    pendingMerchants: merchants.data ?? [],
    recentOrders: orders.data ?? [],
  });
}
