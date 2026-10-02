import { NextResponse } from 'next/server';
import { z } from 'zod';
import {
  extractUnsignedXdr,
  twFundEscrow,
} from '@/lib/trustless-work/client';

const bodySchema = z.object({
  signer: z.string(),
  escrowContractId: z.string(),
  amount: z.number().positive(),
});

export async function POST(req: Request) {
  try {
    const body = bodySchema.parse(await req.json());
    const tw = await twFundEscrow({
      signer: body.signer,
      escrowContractId: body.escrowContractId,
      amount: body.amount,
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
