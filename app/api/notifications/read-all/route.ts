import { NextResponse } from 'next/server';
import {
  isSessionError,
  requireSession,
  sessionProfileId,
} from '@/lib/auth/require-session';
import { markAllNotificationsRead } from '@/lib/db/notifications';
import { isSupabaseConfigured } from '@/lib/supabase/server';

export async function POST(req: Request) {
  if (!isSupabaseConfigured()) {
    return NextResponse.json({ ok: true });
  }

  const session = await requireSession(req);
  if (isSessionError(session)) {
    return session;
  }

  await markAllNotificationsRead(sessionProfileId(session));
  return NextResponse.json({ ok: true });
}
