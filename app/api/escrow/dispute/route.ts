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
import {
  extractUnsignedXdr,
  twDisputeEscrow,
} from '@/lib/trustless-work/client';
import { isSupabaseConfigured } from '@/lib/supabase/server';

const bodySchema = z.object({
  orderId: z.string().uuid(),
  signer: z.string(),
  escrowContractId: z.string(),
});

const DISPUTABLE_STATUSES = ['reserved', 'escrow_pending', 'fiat_pending'];

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

    if (!DISPUTABLE_STATUSES.includes(ctx.status)) {
      return NextResponse.json(
        { error: 'This order cannot be disputed' },
        { status: 400 },
      );
    }

    assertEscrowSigner(ctx, profileId, body.signer, 'dispute');

    const tw = await twDisputeEscrow({
      contractId: body.escrowContractId,
      signer: body.signer,
    });
    return NextResponse.json({
      ...tw,
      unsignedTransaction: extractUnsignedXdr(tw),
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : 'Dispute failed';
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
