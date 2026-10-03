import { NextResponse } from 'next/server';
import { z } from 'zod';
import { resolveSession } from '@/lib/auth/resolve-session';
import {
  getMeProfile,
  updateProfilePayoutAddress,
  updateProfilePaymentPrefs,
  updateUserProfile,
} from '@/lib/db/profiles';
import { paymentPrefsSchema } from '@/lib/profile/payment-prefs';
import { isSupabaseConfigured } from '@/lib/supabase/server';

const patchSchema = z.object({
  platformIntent: z.enum(['buyer', 'merchant', 'both']).optional(),
  displayName: z.string().min(2).max(80).optional(),
  avatarUrl: z.union([z.string().url().max(2048), z.null()]).optional(),
  payoutAddress: z.string().min(56).max(56).optional(),
  paymentPrefs: paymentPrefsSchema.optional(),
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
    if (
      !body.platformIntent &&
      !body.displayName &&
      body.avatarUrl === undefined &&
      !body.payoutAddress &&
      !body.paymentPrefs
    ) {
      return NextResponse.json(
        {
          error:
            'Send displayName, avatarUrl, platformIntent, payoutAddress, or paymentPrefs to update',
        },
        { status: 400 },
      );
    }

    if (body.payoutAddress) {
      await updateProfilePayoutAddress(session.profileId, body.payoutAddress);
    }

    if (body.paymentPrefs) {
      await updateProfilePaymentPrefs(session.profileId, body.paymentPrefs);
    }

    const profileFields =
      body.platformIntent !== undefined ||
      body.displayName !== undefined ||
      body.avatarUrl !== undefined;

    if (!profileFields && (body.payoutAddress || body.paymentPrefs)) {
      const profile = await getMeProfile(session.profileId);
      if (!profile) {
        return NextResponse.json({ error: 'Profile not found' }, { status: 404 });
      }
      return NextResponse.json({ profile });
    }

    if (!profileFields) {
      return NextResponse.json(
        { error: 'No profile fields to update' },
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
      avatarUrl: body.avatarUrl,
    });

    return NextResponse.json({ profile });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : 'Failed to update profile';
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
