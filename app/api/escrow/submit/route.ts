import { NextResponse } from 'next/server';
import { z } from 'zod';
import {
  isSessionError,
  requireSession,
} from '@/lib/auth/require-session';
import { twSendTransaction } from '@/lib/trustless-work/client';
import { getSupabaseAdmin, isSupabaseConfigured } from '@/lib/supabase/server';

const bodySchema = z.object({
  signedXdr: z.string().min(1),
  orderId: z.string().uuid().optional(),
  contractId: z.string().optional(),
  phase: z.enum(['deploy', 'fund', 'approve', 'release']).optional(),
});

export async function POST(req: Request) {
  const session = await requireSession(req);
  if (isSessionError(session)) {
    return session;
  }

  try {
    const body = bodySchema.parse(await req.json());
    const result = await twSendTransaction(body.signedXdr);

    if (body.orderId && isSupabaseConfigured()) {
      const supabase = getSupabaseAdmin();
      const patch: Record<string, unknown> = {
        updated_at: new Date().toISOString(),
      };
      if (body.contractId) {
        patch.tw_contract_id = body.contractId;
      }
      if (body.phase) {
        patch.milestone_state = `${body.phase}_submitted`;
      }
      await supabase
        .from('escrow_sessions')
        .update(patch)
        .eq('order_id', body.orderId);

      if (body.phase === 'release') {
        await supabase
          .from('orders')
          .update({ status: 'released', updated_at: new Date().toISOString() })
          .eq('id', body.orderId);
      }
    }

    return NextResponse.json(result);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : 'Submit failed';
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
