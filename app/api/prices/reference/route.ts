import { NextResponse } from 'next/server';
import { DEFAULT_LATAM_SYMBOLS } from '@/lib/config/network';
import { readPulseFxReference } from '@/lib/reflector/pulse';

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const symbolsParam = url.searchParams.get('symbols');
    const symbols = symbolsParam
      ? symbolsParam.split(',').map((s) => s.trim().toUpperCase())
      : [...DEFAULT_LATAM_SYMBOLS];

    const result = await readPulseFxReference(symbols);
    const freshOnly = url.searchParams.get('fresh') === 'true';
    if (freshOnly) {
      result.quotes = result.quotes.filter((q) => !q.stale);
    }

    return NextResponse.json(result);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : 'Reflector read failed';
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
