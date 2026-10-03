import { NextResponse } from 'next/server';
import { z } from 'zod';
import { resolveSession } from '@/lib/auth/resolve-session';
import { getMeProfile, updateUserProfile } from '@/lib/db/profiles';
import { isSupabaseConfigured } from '@/lib/supabase/server';

const patchSchema = z.object({
  platformIntent: z.enum(['buyer', 'merchant', 'both']).optional(),
  displayName: z.string().min(2).max(80).optional(),
});

export async function GET(request: Request) {
  const session = await resolveSession(request);
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  if (!isSupabaseConfigured()) {
    return NextResponse.json(
      { error: 'Supabase is not configured' },
      { status: 503 },
    );
  }

  if (!session.profileId) {
    return NextResponse.json(
      { error: 'Profile missing — sign in again with Pollar' },
      { status: 401 },
    );
  }

  try {
    const profile = await getMeProfile(session.profileId);
    if (!profile) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 });
    }
    return NextResponse.json({ profile });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : 'Failed to load profile';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  const session = await resolveSession(request);
  if (!session?.profileId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  if (!isSupabaseConfigured()) {
    return NextResponse.json(
      { error: 'Supabase is not configured' },
      { status: 503 },
    );
  }

  try {
    const body = patchSchema.parse(await request.json());
    if (!body.platformIntent && !body.displayName) {
      return NextResponse.json(
        { error: 'Send displayName or platformIntent to update' },
        { status: 400 },
      );
    }

    const needsName =
      body.platformIntent === 'merchant' || body.platformIntent === 'both';
    if (needsName && !body.displayName?.trim()) {
      const existing = await getMeProfile(session.profileId);
      if (!existing?.displayName?.trim()) {
        return NextResponse.json(
          { error: 'Add a merchant display name when selling on UPEER' },
          { status: 400 },
        );
      }
    }

    const profile = await updateUserProfile(session.profileId, {
      platformIntent: body.platformIntent,
      displayName: body.displayName?.trim(),
    });

    return NextResponse.json({ profile });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : 'Failed to update profile';
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
