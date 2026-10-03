import { NextResponse } from 'next/server';
import {
  isSessionError,
  requireSession,
} from '@/lib/auth/require-session';
import { createNotification } from '@/lib/db/notifications';
import { getSupabaseAdmin, isSupabaseConfigured } from '@/lib/supabase/server';

type Params = { params: Promise<{ id: string }> };

export async function POST(req: Request, { params }: Params) {
  if (!isSupabaseConfigured()) {
    return NextResponse.json({ error: 'Supabase not configured' }, { status: 503 });
  }

  const session = await requireSession(req);
  if (isSessionError(session)) {
    return session;
  }

  const { id } = await params;
  const supabase = getSupabaseAdmin();

  const { data: order, error } = await supabase
    .from('orders')
    .select('id, status, maker_profile_id, taker_profile_id')
    .eq('id', id)
    .single();

  if (error || !order) {
    return NextResponse.json({ error: 'Order not found' }, { status: 404 });
  }

  if (order.maker_profile_id !== session.profileId) {
    return NextResponse.json({ error: 'Only the maker can decline' }, { status: 403 });
  }

  if (order.status !== 'pending_acceptance') {
    return NextResponse.json({ error: 'Order cannot be declined' }, { status: 400 });
  }

  const { data: updated, error: updateError } = await supabase
    .from('orders')
    .update({
      status: 'declined',
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)
    .select('*')
    .single();

  if (updateError) {
    return NextResponse.json({ error: updateError.message }, { status: 400 });
  }

  if (order.taker_profile_id) {
    await createNotification({
      profileId: order.taker_profile_id,
      type: 'order_declined',
      title: 'Trade declined',
      body: 'The maker declined your trade request.',
      href: `/market`,
      metadata: { orderId: id },
    });
  }

  return NextResponse.json({ order: updated });
}
