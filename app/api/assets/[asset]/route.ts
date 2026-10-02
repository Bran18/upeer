import { NextResponse } from 'next/server';
import { fetchAssetRating } from '@/lib/stellar-expert/asset';

type Params = { params: Promise<{ asset: string }> };

export async function GET(_req: Request, { params }: Params) {
  const { asset: raw } = await params;
  const decoded = decodeURIComponent(raw);
  const [code, issuer] = decoded.includes('-')
    ? decoded.split('-', 2)
    : ['USDC', decoded];

  if (!code || !issuer) {
    return NextResponse.json({ error: 'Invalid asset id' }, { status: 400 });
  }

  try {
    const rating = await fetchAssetRating(code, issuer);
    return NextResponse.json(rating);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : 'Asset lookup failed';
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
