import { NextResponse } from 'next/server';
import { getServerSession, type SessionPayload } from '@/lib/auth/session';

export async function requireSession(): Promise<
  SessionPayload | NextResponse
> {
  const session = await getServerSession();
  if (!session?.profileId) {
    return NextResponse.json(
      {
        error:
          'Unauthorized — sign in with Pollar and sync server session (Console → Sync).',
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
