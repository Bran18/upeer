import { NextResponse } from 'next/server';
import { z } from 'zod';
import { soroswapQuote } from '@/lib/soroswap/client';

const bodySchema = z.object({
  assetIn: z.string(),
  assetOut: z.string(),
  amount: z.string(),
  slippageBps: z.number().optional(),
});

export async function POST(req: Request) {
  try {
    const body = bodySchema.parse(await req.json());
    const quote = await soroswapQuote({
      assetIn: body.assetIn,
      assetOut: body.assetOut,
      amount: body.amount,
      slippageBps: body.slippageBps,
      protocols: ['soroswap', 'phoenix', 'aqua'],
    });
    return NextResponse.json(quote);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : 'Soroswap quote failed';
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
