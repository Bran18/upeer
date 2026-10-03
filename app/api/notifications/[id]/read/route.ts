import { NextResponse } from 'next/server';
import {
  isSessionError,
  requireSession,
  sessionProfileId,
} from '@/lib/auth/require-session';
import { markNotificationRead } from '@/lib/db/notifications';
import { isSupabaseConfigured } from '@/lib/supabase/server';

type Params = { params: Promise<{ id: string }> };

export async function PATCH(req: Request, { params }: Params) {
  if (!isSupabaseConfigured()) {
    return NextResponse.json({ ok: true });
  }

  const session = await requireSession(req);
  if (isSessionError(session)) {
    return session;
  }

  const { id } = await params;
  await markNotificationRead(sessionProfileId(session), id);
  return NextResponse.json({ ok: true });
}
