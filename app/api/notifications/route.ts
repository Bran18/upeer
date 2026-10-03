import { NextResponse } from 'next/server';
import {
  isSessionError,
  requireSession,
  sessionProfileId,
} from '@/lib/auth/require-session';
import {
  countUnreadNotifications,
  listNotificationsForProfile,
} from '@/lib/db/notifications';
import { isSupabaseConfigured } from '@/lib/supabase/server';

export async function GET(req: Request) {
  if (!isSupabaseConfigured()) {
    return NextResponse.json({ notifications: [], unreadCount: 0 });
  }

  const session = await requireSession(req);
  if (isSessionError(session)) {
    return session;
  }
  const profileId = sessionProfileId(session);

  try {
    const [notifications, unreadCount] = await Promise.all([
      listNotificationsForProfile(profileId),
      countUnreadNotifications(profileId),
    ]);
    return NextResponse.json({ notifications, unreadCount });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : 'Failed to load notifications';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
