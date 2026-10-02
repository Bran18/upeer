import { NextResponse } from 'next/server';
import { z } from 'zod';
import { resolveSession } from '@/lib/auth/resolve-session';
import { completeProfileOnboarding } from '@/lib/db/profiles';
import { defaultPathForIntent } from '@/lib/profile/types';
import { isSupabaseConfigured } from '@/lib/supabase/server';

const bodySchema = z.object({
  platformIntent: z.enum(['buyer', 'merchant', 'both']),
  displayName: z.string().min(2).max(80).optional(),
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
    const body = bodySchema.parse(await req.json());
    const needsName =
      body.platformIntent === 'merchant' || body.platformIntent === 'both';
    if (needsName && !body.displayName?.trim()) {
      return NextResponse.json(
        { error: 'Add a merchant display name to continue' },
        { status: 400 },
      );
    }

    const profile = await completeProfileOnboarding(session.profileId, {
      platformIntent: body.platformIntent,
      displayName: body.displayName?.trim(),
    });

    return NextResponse.json({
      profile,
      redirectTo: defaultPathForIntent(body.platformIntent),
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : 'Onboarding failed';
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
