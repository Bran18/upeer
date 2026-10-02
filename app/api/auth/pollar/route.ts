import { NextResponse } from 'next/server';
import { z } from 'zod';
import {
  createSessionToken,
  SESSION_COOKIE,
  type SessionPayload,
} from '@/lib/auth/session';
import { upsertProfileFromPollar } from '@/lib/db/profiles';
import { verifyPollarAccessToken } from '@/lib/pollar/server';
import { isSupabaseConfigured } from '@/lib/supabase/server';
import { getStellarNetwork } from '@/lib/config/network';

const bodySchema = z.object({
  token: z.string().min(1),
});

export async function POST(req: Request) {
  try {
    const { token } = bodySchema.parse(await req.json());
    const pollar = await verifyPollarAccessToken(token);
    const expectedNetwork = getStellarNetwork();
    if (pollar.network !== expectedNetwork) {
      return NextResponse.json(
        { error: 'Pollar app network does not match UPEER deployment' },
        { status: 400 },
      );
    }

    let profileId: string | undefined;
    if (isSupabaseConfigured()) {
      profileId = await upsertProfileFromPollar(pollar);
    }

    const expiresAt = new Date(pollar.expiresAt);
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
      expiresAt: pollar.expiresAt,
      stellarAddress: pollar.wallet.publicKey,
      profileId,
    });
    response.cookies.set(SESSION_COOKIE, accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      expires: expiresAt,
    });
    return response;
  } catch (error) {
    const message =
      error instanceof Error ? error.message : 'Authentication failed';
    return NextResponse.json({ error: message }, { status: 401 });
  }
}
