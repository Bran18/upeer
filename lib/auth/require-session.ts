import { NextResponse } from 'next/server';
import { resolveSession } from '@/lib/auth/resolve-session';
import type { SessionPayload } from '@/lib/auth/session';

export async function requireSession(
  request?: Request,
): Promise<SessionPayload | NextResponse> {
  const session = await resolveSession(request);
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  if (!session.profileId) {
    return NextResponse.json(
      {
        error:
          'Profile missing — sign in with Pollar again to link your account.',
      },
      { status: 401 },
    );
  }
  return session;
}

export function isSessionError(
  value: SessionPayload | NextResponse,
): value is NextResponse {
  return value instanceof NextResponse;
}
