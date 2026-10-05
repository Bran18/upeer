import { NextResponse } from 'next/server';
import { z } from 'zod';
import {
  isSessionError,
  requireSession,
  sessionProfileId,
} from '@/lib/auth/require-session';
import { p2pLegs } from '@/lib/escrow/p2p-legs';
import { trustlinePayloadForAsset } from '@/lib/settlement/assets';
import {
  assertEscrowSigner,
  loadOrderEscrowContext,
} from '@/lib/escrow/order-access';
import {
  extractDeployContractId,
  extractUnsignedXdr,
  twDeploySingleRelease,
} from '@/lib/trustless-work/client';
import { getSupabaseAdmin, isSupabaseConfigured } from '@/lib/supabase/server';

const bodySchema = z.object({
  orderId: z.string().uuid(),
  signer: z.string(),
});

function operatorRole(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`${name} is not configured`);
  }
  return value;
}

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

    if (!['reserved', 'escrow_pending'].includes(ctx.status)) {
      return NextResponse.json(
        { error: 'Order is not ready for escrow deploy' },
        { status: 400 },
      );
    }

    assertEscrowSigner(ctx, profileId, body.signer, 'deploy');

    const supabase = getSupabaseAdmin();
    const { data: existingSession } = await supabase
      .from('escrow_sessions')
      .select('tw_contract_id')
      .eq('order_id', body.orderId)
      .maybeSingle();
    if (existingSession?.tw_contract_id) {
      return NextResponse.json(
        {
          error: 'Escrow already deployed for this order',
          contractId: existingSession.tw_contract_id,
        },
        { status: 400 },
      );
    }

    const platform = operatorRole('UPEER_PLATFORM_ADDRESS');
    const trustline = trustlinePayloadForAsset(ctx.settlementAsset);
    const legs = p2pLegs(ctx);
    const sellerAddress = legs.usdcSellerAddress;
    const buyerAddress = legs.usdcBuyerAddress;
    if (!merchantAddressValid(sellerAddress)) {
      return NextResponse.json(
        { error: 'Escrow seller has no Stellar address on file' },
        { status: 400 },
      );
    }
    if (!merchantAddressValid(buyerAddress)) {
      return NextResponse.json(
        { error: 'Escrow buyer wallet address missing' },
        { status: 400 },
      );
    }

    const payload = {
      signer: body.signer,
      engagementId: ctx.engagementId,
      title: `UPEER P2P ${ctx.engagementId.slice(0, 8)}`,
      description: `${ctx.settlementAsset} escrow (${ctx.side})`,
      roles: {
        approver: sellerAddress!,
        serviceProvider: sellerAddress!,
        releaseSigner: sellerAddress!,
        platformAddress: platform,
        disputeResolver: platform,
        receiver: buyerAddress!,
      },
      amount: ctx.usdcAmount,
      platformFee: Number(process.env.UPEER_PLATFORM_FEE_BPS ?? '50'),
      milestones: [{ description: 'Fiat leg confirmed per UPEER policy' }],
      trustline,
    };

    const tw = await twDeploySingleRelease(payload);
    const twRecord = tw as Record<string, unknown>;
    const xdr = extractUnsignedXdr(tw);
    const contractId = extractDeployContractId(twRecord);

    await supabase
      .from('orders')
      .update({ status: 'escrow_pending', updated_at: new Date().toISOString() })
      .eq('id', body.orderId);

    const sessionPatch: Record<string, unknown> = {
      milestone_state: 'deploy_unsigned',
      updated_at: new Date().toISOString(),
    };
    if (contractId) {
      sessionPatch.tw_contract_id = contractId;
    }
    await supabase
      .from('escrow_sessions')
      .update(sessionPatch)
      .eq('order_id', body.orderId);

    return NextResponse.json({
      ...tw,
      unsignedTransaction: xdr,
      contractId,
      engagementId: ctx.engagementId,
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : 'Escrow deploy failed';
    return NextResponse.json({ error: message }, { status: 400 });
  }
}

function merchantAddressValid(addr: string | null | undefined): boolean {
  return Boolean(addr?.startsWith('G') && addr.length === 56);
}
