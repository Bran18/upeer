import { NextResponse } from 'next/server';
import {
  isSessionError,
  requireSession,
  sessionProfileId,
} from '@/lib/auth/require-session';
import { profileIsOperator } from '@/lib/db/profiles';
import { getOrderDetailForParticipant } from '@/lib/db/orders';
import { isSupabaseConfigured } from '@/lib/supabase/server';

type Params = { params: Promise<{ id: string }> };

export async function GET(req: Request, { params }: Params) {
  if (!isSupabaseConfigured()) {
    return NextResponse.json({ error: 'Supabase not configured' }, { status: 503 });
  }

  const session = await requireSession(req);
  if (isSessionError(session)) {
    return session;
  }
  const profileId = sessionProfileId(session);

  const { id } = await params;
  try {
    const isOperator = await profileIsOperator(profileId);
    const order = await getOrderDetailForParticipant(
      id,
      profileId,
      isOperator,
    );

    if (!order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    return NextResponse.json({ order, isOperator });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : 'Could not load this order';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
