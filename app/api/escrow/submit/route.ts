import { NextResponse } from 'next/server';
import { z } from 'zod';
import {
  isSessionError,
  requireSession,
} from '@/lib/auth/require-session';
import {
  extractSendTransactionContractId,
  pickEscrowContractByEngagement,
  twGetEscrowsBySigner,
  twSendTransaction,
  twUpdateFromTxHash,
} from '@/lib/trustless-work/client';
import { getSupabaseAdmin, isSupabaseConfigured } from '@/lib/supabase/server';

const bodySchema = z
  .object({
    signedXdr: z.string().min(1).optional(),
    submittedViaWallet: z.literal(true).optional(),
    txHash: z.string().optional(),
    signer: z.string().optional(),
    orderId: z.string().uuid().optional(),
    contractId: z.string().optional(),
    phase: z.enum(['deploy', 'fund', 'approve', 'release']).optional(),
  })
  .superRefine((data, ctx) => {
    if (!data.submittedViaWallet && !data.signedXdr) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'signedXdr is required unless submittedViaWallet is true',
      });
    }
  });

export async function POST(req: Request) {
  const session = await requireSession(req);
  if (isSessionError(session)) {
    return session;
  }

  try {
    const body = bodySchema.parse(await req.json());
    let contractId = body.contractId;

    const result = body.signedXdr
      ? await twSendTransaction(body.signedXdr)
      : { status: 'submitted_via_wallet', hash: body.txHash ?? null };

    const txHash =
      body.txHash ??
      (typeof result === 'object' &&
      result !== null &&
      typeof (result as { hash?: string }).hash === 'string'
        ? (result as { hash: string }).hash
        : null);

    if (txHash) {
      try {
        await twUpdateFromTxHash(txHash);
      } catch {
        // non-fatal; status poll may retry sync
      }
    }

    if (
      !contractId &&
      body.phase === 'deploy' &&
      body.signer &&
      body.orderId &&
      isSupabaseConfigured()
    ) {
      contractId =
        extractSendTransactionContractId(result) ??
        (await resolveContractByEngagement(body.orderId, body.signer)) ??
        undefined;
    }

    if (body.orderId && isSupabaseConfigured()) {
      const supabase = getSupabaseAdmin();
      const patch: Record<string, unknown> = {
        updated_at: new Date().toISOString(),
      };
      if (contractId) {
        patch.tw_contract_id = contractId;
      }
      if (body.phase) {
        patch.milestone_state = `${body.phase}_submitted`;
      }
      if (txHash) {
        patch.last_tx_hash = txHash;
      }
      let { error: sessionUpdateError } = await supabase
        .from('escrow_sessions')
        .update(patch)
        .eq('order_id', body.orderId);
      if (sessionUpdateError && txHash && patch.last_tx_hash) {
        const { last_tx_hash: _drop, ...withoutTx } = patch;
        ({ error: sessionUpdateError } = await supabase
          .from('escrow_sessions')
          .update(withoutTx)
          .eq('order_id', body.orderId));
      }
      if (sessionUpdateError) {
        throw new Error(sessionUpdateError.message);
      }

      if (body.phase === 'release') {
        await supabase
          .from('orders')
          .update({ status: 'released', updated_at: new Date().toISOString() })
          .eq('id', body.orderId);
      }
    }

    return NextResponse.json({
      ...(typeof result === 'object' && result !== null ? result : { result }),
      contractId: contractId ?? null,
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : 'Submit failed';
    return NextResponse.json({ error: message }, { status: 400 });
  }
}

async function resolveContractByEngagement(
  orderId: string,
  signer: string,
): Promise<string | null> {
  const supabase = getSupabaseAdmin();
  const { data: order } = await supabase
    .from('orders')
    .select('engagement_id')
    .eq('id', orderId)
    .maybeSingle();
  if (!order?.engagement_id) {
    return null;
  }
  try {
    const escrows = await twGetEscrowsBySigner(signer, true);
    return pickEscrowContractByEngagement(escrows, order.engagement_id);
  } catch {
    return null;
  }
}
