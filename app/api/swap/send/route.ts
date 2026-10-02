import { NextResponse } from 'next/server';
import { z } from 'zod';
import { soroswapSend } from '@/lib/soroswap/client';

const bodySchema = z.object({
  signedXdr: z.string().min(1),
});

export async function POST(req: Request) {
  try {
    const { signedXdr } = bodySchema.parse(await req.json());
    const result = await soroswapSend(signedXdr);
    return NextResponse.json(result);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : 'Soroswap send failed';
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
