import { NextResponse } from 'next/server';
import { z } from 'zod';
import {
  isSessionError,
  requireSession,
} from '@/lib/auth/require-session';
import { getSupabaseAdmin, isSupabaseConfigured } from '@/lib/supabase/server';

const bodySchema = z.object({
  payoutAddress: z.string().regex(/^G[ABCDEFGHIJKLMNOPQRSTUVWXYZ234567]{55}$/),
});

export async function PATCH(req: Request) {
  if (!isSupabaseConfigured()) {
    return NextResponse.json({ error: 'Supabase not configured' }, { status: 503 });
  }

  const session = await requireSession(req);
  if (isSessionError(session)) {
    return session;
  }

  try {
    const { payoutAddress } = bodySchema.parse(await req.json());
    const supabase = getSupabaseAdmin();
    const { data, error } = await supabase
      .from('merchants')
      .update({
        payout_address: payoutAddress,
        updated_at: new Date().toISOString(),
      })
      .eq('profile_id', session.profileId)
      .eq('status', 'approved')
      .select('id, payout_address')
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    return NextResponse.json(data);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : 'Invalid payout address';
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
