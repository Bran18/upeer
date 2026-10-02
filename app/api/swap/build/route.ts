import { NextResponse } from 'next/server';
import { z } from 'zod';
import { soroswapBuild } from '@/lib/soroswap/client';

const bodySchema = z.object({
  quote: z.unknown(),
  from: z.string(),
  to: z.string().optional(),
});

export async function POST(req: Request) {
  try {
    const body = bodySchema.parse(await req.json());
    const built = await soroswapBuild(body.quote, body.from, body.to);
    return NextResponse.json(built);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : 'Soroswap build failed';
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
