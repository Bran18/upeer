import { NextResponse } from 'next/server';
import { z } from 'zod';
import { getNetworkConfig } from '@/lib/config/network';
import {
  extractUnsignedXdr,
  twDeploySingleRelease,
} from '@/lib/trustless-work/client';
import { getSupabaseAdmin, isSupabaseConfigured } from '@/lib/supabase/server';

const bodySchema = z.object({
  engagementId: z.string().uuid(),
  signer: z.string(),
  amount: z.number().positive(),
  side: z.enum(['sell_usdc', 'buy_usdc']),
  buyerAddress: z.string(),
  merchantAddress: z.string().optional(),
  merchantLabel: z.string().optional(),
  orderId: z.string().uuid().optional(),
});

function operatorRole(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`${name} is not configured`);
  }
  return value;
}

export async function POST(req: Request) {
  try {
    const body = bodySchema.parse(await req.json());
    const network = getNetworkConfig();
    const platform = operatorRole('UPEER_PLATFORM_ADDRESS');

    let merchantAddress =
      body.merchantAddress ??
      process.env.UPEER_DEMO_MERCHANT_ADDRESS ??
      body.buyerAddress;
    let side = body.side;
    let merchantLabel = body.merchantLabel;
    let engagementId = body.engagementId;

    if (body.orderId && isSupabaseConfigured()) {
      const supabase = getSupabaseAdmin();
      const { data: order } = await supabase
        .from('orders')
        .select(
          `
          engagement_id,
          quotes!inner (
            usdc_amount,
            offers!inner (
              side,
              merchants!inner (display_name, payout_address)
            )
          )
        `,
        )
        .eq('id', body.orderId)
        .single();

      if (order) {
        engagementId = order.engagement_id;
        const rawQuotes = order.quotes;
        const quoteRow = Array.isArray(rawQuotes) ? rawQuotes[0] : rawQuotes;
        if (!quoteRow) {
          throw new Error('Order quote missing');
        }
        const rawOffers = quoteRow.offers;
        const offerRow = Array.isArray(rawOffers) ? rawOffers[0] : rawOffers;
        const rawMerchants = offerRow?.merchants;
        const merchants = (Array.isArray(rawMerchants)
          ? rawMerchants[0]
          : rawMerchants) as {
          display_name: string;
          payout_address: string;
        };
        if (!merchants) {
          throw new Error('Merchant missing on order');
        }
        if (merchants.payout_address) {
          merchantAddress = merchants.payout_address;
        }
        merchantLabel = merchants.display_name;
        side = offerRow.side as 'sell_usdc' | 'buy_usdc';
      }
    }

    const isSell = side === 'sell_usdc';
    const serviceProvider = isSell ? merchantAddress : body.buyerAddress;
    const receiver = isSell ? body.buyerAddress : merchantAddress;

    const payload = {
      signer: body.signer,
      engagementId,
      title: `UPEER OTC ${engagementId.slice(0, 8)}`,
      description: `USDC escrow for ${merchantLabel ?? 'merchant'} (${side})`,
      roles: {
        approver: platform,
        serviceProvider,
        platformAddress: platform,
        releaseSigner: platform,
        disputeResolver: platform,
        receiver,
      },
      amount: body.amount,
      platformFee: Number(process.env.UPEER_PLATFORM_FEE_BPS ?? '50'),
      milestones: [{ description: 'Fiat leg confirmed per UPEER policy' }],
      trustline: {
        address: network.usdcIssuer,
        symbol: 'USDC',
      },
    };

    const tw = await twDeploySingleRelease(payload);
    const xdr = extractUnsignedXdr(tw);

    if (body.orderId && isSupabaseConfigured()) {
      const supabase = getSupabaseAdmin();
      await supabase
        .from('orders')
        .update({ status: 'escrow_pending', updated_at: new Date().toISOString() })
        .eq('id', body.orderId);
      await supabase
        .from('escrow_sessions')
        .update({
          milestone_state: 'deploy_submitted',
          updated_at: new Date().toISOString(),
        })
        .eq('order_id', body.orderId);
    }

    return NextResponse.json({
      ...tw,
      unsignedTransaction: xdr,
      engagementId,
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : 'Escrow deploy failed';
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
