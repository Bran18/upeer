import { NextResponse } from 'next/server';
import { z } from 'zod';
import {
  isSessionError,
  requireSession,
  sessionProfileId,
} from '@/lib/auth/require-session';
import { getNetworkConfig } from '@/lib/config/network';
import {
  assertEscrowSigner,
  loadOrderEscrowContext,
} from '@/lib/escrow/order-access';
import {
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

    const network = getNetworkConfig();
    const platform = operatorRole('UPEER_PLATFORM_ADDRESS');
    const makerAddress = ctx.makerPayoutAddress;
    if (!merchantAddressValid(makerAddress)) {
      return NextResponse.json(
        { error: 'Maker has no payout address on file' },
        { status: 400 },
      );
    }

    const takerAddress = ctx.takerStellarAddress;
    if (!merchantAddressValid(takerAddress)) {
      return NextResponse.json(
        { error: 'Taker wallet address missing' },
        { status: 400 },
      );
    }

    const isSell = ctx.side === 'sell_usdc';
    const serviceProvider = isSell ? makerAddress! : takerAddress!;
    const receiver = isSell ? takerAddress! : makerAddress!;

    const payload = {
      signer: body.signer,
      engagementId: ctx.engagementId,
      title: `UPEER P2P ${ctx.engagementId.slice(0, 8)}`,
      description: `USDC escrow (${ctx.side})`,
      roles: {
        approver: platform,
        serviceProvider,
        platformAddress: platform,
        releaseSigner: platform,
        disputeResolver: platform,
        receiver,
      },
      amount: ctx.usdcAmount,
      platformFee: Number(process.env.UPEER_PLATFORM_FEE_BPS ?? '50'),
      milestones: [{ description: 'Fiat leg confirmed per UPEER policy' }],
      trustline: {
        address: network.usdcIssuer,
        symbol: 'USDC',
      },
    };

    const tw = await twDeploySingleRelease(payload);
    const xdr = extractUnsignedXdr(tw);

    const supabase = getSupabaseAdmin();
    await supabase
      .from('orders')
      .update({ status: 'escrow_pending', updated_at: new Date().toISOString() })
      .eq('id', body.orderId);
    await supabase
      .from('escrow_sessions')
      .update({
        milestone_state: 'deploy_unsigned',
        updated_at: new Date().toISOString(),
      })
      .eq('order_id', body.orderId);

    return NextResponse.json({
      ...tw,
      unsignedTransaction: xdr,
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
