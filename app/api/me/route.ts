import { NextResponse } from 'next/server';
import { getServerSession } from '@/lib/auth/session';
import { getMeProfile } from '@/lib/db/profiles';
import { isSupabaseConfigured } from '@/lib/supabase/server';

export async function GET() {
  const session = await getServerSession();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  if (!isSupabaseConfigured()) {
    return NextResponse.json(
      { error: 'Supabase is not configured' },
      { status: 503 },
    );
  }

  if (!session.profileId) {
    return NextResponse.json(
      { error: 'Profile missing — sign in again with Pollar' },
      { status: 401 },
    );
  }

  try {
    const profile = await getMeProfile(session.profileId);
    if (!profile) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 });
    }
    return NextResponse.json({ profile });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : 'Failed to load profile';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
