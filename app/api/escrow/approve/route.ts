import { NextResponse } from 'next/server';
import { z } from 'zod';
import {
  extractUnsignedXdr,
  twApproveMilestone,
} from '@/lib/trustless-work/client';

const bodySchema = z.object({
  signer: z.string(),
  escrowContractId: z.string(),
  milestoneIndex: z.string().default('0'),
});

export async function POST(req: Request) {
  try {
    const body = bodySchema.parse(await req.json());
    const tw = await twApproveMilestone({
      signer: body.signer,
      escrowContractId: body.escrowContractId,
      milestoneIndex: body.milestoneIndex,
    });
    return NextResponse.json({
      ...tw,
      unsignedTransaction: extractUnsignedXdr(tw),
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : 'Approve failed';
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
