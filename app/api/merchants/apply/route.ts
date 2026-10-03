import { NextResponse } from 'next/server';
import { z } from 'zod';
import { resolveSession } from '@/lib/auth/resolve-session';
import { getMeProfile, updateUserProfile } from '@/lib/db/profiles';
import { getSupabaseAdmin, isSupabaseConfigured } from '@/lib/supabase/server';

const bodySchema = z.object({
  displayName: z.string().min(2).max(80),
});

export async function POST(req: Request) {
  if (!isSupabaseConfigured()) {
    return NextResponse.json(
      { error: 'Supabase is not configured' },
      { status: 503 },
    );
  }

  const session = await resolveSession(req);
  if (!session?.profileId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { displayName } = bodySchema.parse(await req.json());
    const existing = await getMeProfile(session.profileId);
    const nextIntent =
      existing?.platformIntent === 'buyer' ||
      existing?.platformIntent === 'both'
        ? 'both'
        : 'merchant';

    await updateUserProfile(session.profileId, {
      displayName,
      platformIntent: nextIntent,
    });

    const supabase = getSupabaseAdmin();
    const { data: merchant, error: lookupError } = await supabase
      .from('merchants')
      .select('id, status')
      .eq('profile_id', session.profileId)
      .maybeSingle();

    if (lookupError) {
      throw new Error(lookupError.message);
    }

    const now = new Date().toISOString();
    const keepStatus =
      merchant?.status === 'approved' || merchant?.status === 'suspended';
    const nextStatus = keepStatus ? merchant.status : 'pending';

    const { data, error } = await supabase
      .from('merchants')
      .upsert(
        {
          profile_id: session.profileId,
          display_name: displayName,
          status: nextStatus,
          updated_at: now,
        },
        { onConflict: 'profile_id' },
      )
      .select('id, status')
      .single();

    if (error) {
      throw new Error(error.message);
    }
    return NextResponse.json(data);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : 'Merchant apply failed';
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
