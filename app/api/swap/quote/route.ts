import { NextResponse } from 'next/server';
import { z } from 'zod';
import { getStellarNetwork } from '@/lib/config/network';
import { serializeSoroswapJson, soroswapQuote } from '@/lib/soroswap/client';
import { getSoroswapTestnetSwapTokens } from '@/lib/soroswap/testnet-tokens';

const bodySchema = z.object({
  assetIn: z.string(),
  assetOut: z.string(),
  amount: z.string(),
  slippageBps: z.number().optional(),
});

export async function POST(req: Request) {
  try {
    const body = bodySchema.parse(await req.json());
    let assetIn = body.assetIn;
    let assetOut = body.assetOut;
    if (getStellarNetwork() === 'testnet') {
      const tokens = await getSoroswapTestnetSwapTokens();
      assetIn = tokens.xlmSac;
      assetOut = tokens.usdcSac;
    }
    const quote = await soroswapQuote({
      assetIn,
      assetOut,
      amount: body.amount,
      slippageBps: body.slippageBps,
    });
    return NextResponse.json(serializeSoroswapJson(quote));
  } catch (error) {
    const raw =
      error instanceof Error ? error.message : 'Soroswap quote failed';
    const message =
      raw === 'No path found' || raw === 'Quote Failed'
        ? 'No Soroswap swap route for XLM → USDC on testnet. Use Mint test USDC on this page instead.'
        : raw;
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
