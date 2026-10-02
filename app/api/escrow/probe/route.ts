import { NextResponse } from 'next/server';
import { probeTrustlessWork } from '@/lib/trustless-work/client';

export async function GET() {
  const result = await probeTrustlessWork();
  return NextResponse.json(result);
}
