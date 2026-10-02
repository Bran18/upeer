import { NextResponse } from 'next/server';
import { z } from 'zod';
import {
  createSessionToken,
  SESSION_COOKIE,
  type SessionPayload,
} from '@/lib/auth/session';
import { getMeProfile, upsertProfileFromPollar } from '@/lib/db/profiles';
import type { PlatformIntent } from '@/lib/profile/types';
import {
  mergeStellarWalletHint,
  verifyPollarAccessToken,
} from '@/lib/pollar/server';
import { isStellarAddress } from '@/lib/pollar/resolve-stellar-wallet';
import { isSupabaseConfigured } from '@/lib/supabase/server';
import { parseExpiresAt } from '@/lib/auth/parse-expires-at';
import { getStellarNetwork } from '@/lib/config/network';

const bodySchema = z.object({
  token: z.string().min(1),
  stellarAddress: z
    .string()
    .refine((v) => isStellarAddress(v), 'Invalid Stellar address')
    .optional(),
  custody: z.enum(['internal', 'external', 'smart']).optional(),
});

export async function POST(req: Request) {
  try {
    const { token, stellarAddress, custody } = bodySchema.parse(
      await req.json(),
    );
    const pollar = mergeStellarWalletHint(
      await verifyPollarAccessToken(token),
      { stellarAddress, custody },
    );

    if (!isStellarAddress(pollar.wallet.publicKey)) {
      return NextResponse.json(
        {
          error:
            'Wallet address is not ready yet. Wait a moment after login and try again.',
        },
        { status: 409 },
      );
    }
    const expectedNetwork = getStellarNetwork();
    if (pollar.network !== expectedNetwork) {
      return NextResponse.json(
        { error: 'Pollar app network does not match UPEER deployment' },
        { status: 400 },
      );
    }

    let profileId: string | undefined;
    let profileSummary:
      | {
          platformIntent: string | null;
          onboardingCompletedAt: string | null;
        }
      | undefined;
    if (isSupabaseConfigured()) {
      profileId = await upsertProfileFromPollar(pollar);
      const me = await getMeProfile(profileId);
      if (me) {
        profileSummary = {
          platformIntent: me.platformIntent,
          onboardingCompletedAt: me.onboardingCompletedAt,
        };
      }
    }

    const expiresAt = parseExpiresAt(pollar.expiresAt);
    const maxAgeSeconds = Math.max(
      60,
      Math.floor((expiresAt.getTime() - Date.now()) / 1000),
    );
    const payload: SessionPayload = {
      sub: pollar.userId,
      pollarUserId: pollar.userId,
      stellarAddress: pollar.wallet.publicKey,
      network: pollar.network,
      profileId,
    };
    const accessToken = await createSessionToken(payload, expiresAt);

    const response = NextResponse.json({
      accessToken,
      expiresAt: expiresAt.toISOString(),
      stellarAddress: pollar.wallet.publicKey,
      profileId,
      onboardingComplete: Boolean(
        profileSummary?.onboardingCompletedAt &&
          profileSummary.platformIntent,
      ),
      platformIntent:
        (profileSummary?.platformIntent as PlatformIntent | null) ?? null,
    });
    response.cookies.set(SESSION_COOKIE, accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      expires: expiresAt,
      maxAge: maxAgeSeconds,
    });
    return response;
  } catch (error) {
    const message =
      error instanceof Error ? error.message : 'Authentication failed';
    return NextResponse.json({ error: message }, { status: 401 });
  }
}
