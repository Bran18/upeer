import { SignJWT, jwtVerify } from 'jose';
import { cookies } from 'next/headers';
import { resolveSessionSecret } from '@/lib/config/env';

export const SESSION_COOKIE = 'upeer_session';

export type SessionPayload = {
  sub: string;
  pollarUserId: string;
  stellarAddress: string;
  network: 'testnet' | 'mainnet';
  profileId?: string;
};

function sessionSecret(): Uint8Array {
  return new TextEncoder().encode(resolveSessionSecret());
}

export async function createSessionToken(
  payload: SessionPayload,
  expiresAt: Date,
): Promise<string> {
  return new SignJWT({ ...payload })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(expiresAt)
    .sign(sessionSecret());
}

export async function verifySessionToken(
  token: string,
): Promise<SessionPayload | null> {
  try {
    const { payload } = await jwtVerify(token, sessionSecret());
    return payload as SessionPayload;
  } catch {
    return null;
  }
}

export async function getServerSession(): Promise<SessionPayload | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  if (!token) {
    return null;
  }
  return verifySessionToken(token);
}
