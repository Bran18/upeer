import { NextResponse } from 'next/server';
import { z } from 'zod';
import {
  isSessionError,
  requireSession,
  sessionProfileId,
} from '@/lib/auth/require-session';
import {
  assertEscrowSigner,
  loadOrderEscrowContext,
} from '@/lib/escrow/order-access';
import { fetchEscrowOnChainSnapshot } from '@/lib/escrow/fetch-on-chain';
import { shouldHideFundEscrowAction } from '@/lib/escrow/funding-state';
import { p2pLegs } from '@/lib/escrow/p2p-legs';
import {
  extractUnsignedXdr,
  twFundEscrow,
} from '@/lib/trustless-work/client';
import { getSupabaseAdmin, isSupabaseConfigured } from '@/lib/supabase/server';

const bodySchema = z.object({
  orderId: z.string().uuid(),
  signer: z.string(),
  escrowContractId: z.string(),
});

export async function POST(req: Request) {
  if (!isSupabaseConfigured()) {
    return NextResponse.json({ error: 'Supabase not configured' }, { status: 503 });
  }

  const session = await requireSession(req);
  if (isSessionError(session)) {
    return session;
  }
  const profileId = sessionProfileId(session);

  try {
    const body = bodySchema.parse(await req.json());
    const ctx = await loadOrderEscrowContext(body.orderId, profileId);
    if (!ctx) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    assertEscrowSigner(ctx, profileId, body.signer, 'fund');

    const supabase = getSupabaseAdmin();
    const { data: sessionRow } = await supabase
      .from('escrow_sessions')
      .select('milestone_state, last_tx_hash')
      .eq('order_id', body.orderId)
      .maybeSingle();

    const legs = p2pLegs(ctx);
    const snapshot = await fetchEscrowOnChainSnapshot(body.escrowContractId, {
      expectedAmount: ctx.usdcAmount,
      engagementId: ctx.engagementId,
      sellerSigner: legs.usdcSellerAddress,
      syncTxHash: sessionRow?.last_tx_hash,
    });

    if (
      shouldHideFundEscrowAction(
        sessionRow?.milestone_state ?? 'idle',
        snapshot,
      )
    ) {
      return NextResponse.json(
        { error: 'Escrow is already funded or funding is in progress.' },
        { status: 409 },
      );
    }

    const tw = await twFundEscrow({
      signer: body.signer,
      contractId: body.escrowContractId,
      amount: ctx.usdcAmount,
    });
    return NextResponse.json({
      ...tw,
      unsignedTransaction: extractUnsignedXdr(tw),
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : 'Fund escrow failed';
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
