import { NextResponse } from 'next/server';
import { z } from 'zod';
import { twSendTransaction } from '@/lib/trustless-work/client';

const bodySchema = z.object({
  signedXdr: z.string().min(1),
});

export async function POST(req: Request) {
  try {
    const { signedXdr } = bodySchema.parse(await req.json());
    const result = await twSendTransaction(signedXdr);
    return NextResponse.json(result);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : 'Submit failed';
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
