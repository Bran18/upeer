import {
  getServerSession,
  verifySessionToken,
  type SessionPayload,
} from '@/lib/auth/session';

function bearerToken(request: Request): string | null {
  const header = request.headers.get('authorization');
  if (!header) {
    return null;
  }
  const match = /^Bearer\s+(.+)$/i.exec(header);
  return match?.[1]?.trim() ?? null;
}

/** Cookie session (RSC) or `Authorization: Bearer` (client fetch). */
export async function resolveSession(
  request?: Request,
): Promise<SessionPayload | null> {
  const fromCookie = await getServerSession();
  if (fromCookie) {
    return fromCookie;
  }
  if (!request) {
    return null;
  }
  const token = bearerToken(request);
  if (!token) {
    return null;
  }
  return verifySessionToken(token);
}
