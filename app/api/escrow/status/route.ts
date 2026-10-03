import { NextResponse } from 'next/server';
import { z } from 'zod';
import {
  isSessionError,
  requireSession,
  sessionProfileId,
} from '@/lib/auth/require-session';
import { fetchEscrowOnChainSnapshot } from '@/lib/escrow/fetch-on-chain';
import { p2pLegs } from '@/lib/escrow/p2p-legs';
import { loadOrderEscrowContext } from '@/lib/escrow/order-access';
import { getSupabaseAdmin, isSupabaseConfigured } from '@/lib/supabase/server';

const querySchema = z.object({
  orderId: z.string().uuid(),
});

export async function GET(req: Request) {
  if (!isSupabaseConfigured()) {
    return NextResponse.json({ error: 'Supabase not configured' }, { status: 503 });
  }

  const session = await requireSession(req);
  if (isSessionError(session)) {
    return session;
  }
  const profileId = sessionProfileId(session);

  const url = new URL(req.url);
  const parsed = querySchema.safeParse({
    orderId: url.searchParams.get('orderId'),
  });
  if (!parsed.success) {
    return NextResponse.json({ error: 'orderId is required' }, { status: 400 });
  }

  const ctx = await loadOrderEscrowContext(parsed.data.orderId, profileId);
  if (!ctx) {
    return NextResponse.json({ error: 'Order not found' }, { status: 404 });
  }

  const supabase = getSupabaseAdmin();
  const { data: sessionRow } = await supabase
    .from('escrow_sessions')
    .select('tw_contract_id, milestone_state, last_tx_hash')
    .eq('order_id', parsed.data.orderId)
    .maybeSingle();

  const contractId = sessionRow?.tw_contract_id;
  if (!contractId) {
    return NextResponse.json({
      contractId: null,
      milestoneState: sessionRow?.milestone_state ?? 'idle',
      snapshot: null,
    });
  }

  const legs = p2pLegs(ctx);
  const queryTxHash = url.searchParams.get('txHash')?.trim() || null;
  const syncTxHash = queryTxHash || sessionRow?.last_tx_hash || null;

  try {
    const snapshot = await fetchEscrowOnChainSnapshot(contractId, {
      expectedAmount: ctx.usdcAmount,
      engagementId: ctx.engagementId,
      sellerSigner: legs.usdcSellerAddress,
      syncTxHash,
    });

    let milestoneState = sessionRow?.milestone_state ?? 'idle';
    if (snapshot?.released) {
      milestoneState = 'released';
      await supabase
        .from('escrow_sessions')
        .update({
          milestone_state: 'released',
          updated_at: new Date().toISOString(),
        })
        .eq('order_id', parsed.data.orderId);
      if (ctx.status !== 'released') {
        await supabase
          .from('orders')
          .update({
            status: 'released',
            updated_at: new Date().toISOString(),
          })
          .eq('id', parsed.data.orderId);
      }
    } else if (snapshot?.funded && milestoneState !== 'funded') {
      await supabase
        .from('escrow_sessions')
        .update({
          milestone_state: 'funded',
          updated_at: new Date().toISOString(),
        })
        .eq('order_id', parsed.data.orderId);
      milestoneState = 'funded';
    }

    return NextResponse.json({
      contractId,
      milestoneState,
      snapshot,
      error: snapshot ? null : 'On-chain escrow events not found yet — try again shortly',
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : 'Escrow status unavailable';
    return NextResponse.json({
      contractId,
      milestoneState: sessionRow?.milestone_state ?? 'idle',
      snapshot: null,
      error: message,
    });
  }
}
