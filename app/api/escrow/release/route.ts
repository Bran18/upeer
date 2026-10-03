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
  twReleaseFunds,
} from '@/lib/trustless-work/client';
import { isSupabaseConfigured } from '@/lib/supabase/server';

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

    assertEscrowSigner(ctx, profileId, body.signer, 'release');

    const tw = await twReleaseFunds({
      signer: body.signer,
      escrowContractId: body.escrowContractId,
    });
    return NextResponse.json({
      ...tw,
      unsignedTransaction: extractUnsignedXdr(tw),
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : 'Release failed';
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
