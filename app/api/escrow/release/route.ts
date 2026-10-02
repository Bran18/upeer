import { NextResponse } from 'next/server';
import { z } from 'zod';
import {
  extractUnsignedXdr,
  twReleaseFunds,
} from '@/lib/trustless-work/client';

const bodySchema = z.object({
  signer: z.string(),
  escrowContractId: z.string(),
});

export async function POST(req: Request) {
  try {
    const body = bodySchema.parse(await req.json());
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
