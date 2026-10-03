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

/** Use after `requireSession` when `isSessionError` is false. */
export function sessionProfileId(session: SessionPayload): string {
  if (!session.profileId) {
    throw new Error('Profile missing on session');
  }
  return session.profileId;
}
