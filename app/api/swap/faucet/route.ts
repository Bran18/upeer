import { NextResponse } from 'next/server';
import { z } from 'zod';
import {
  isSessionError,
  requireSession,
} from '@/lib/auth/require-session';
import { getStellarNetwork } from '@/lib/config/network';
import { soroswapFaucetMint } from '@/lib/soroswap/client';
import { getSoroswapTestnetSwapTokens } from '@/lib/soroswap/testnet-tokens';

const bodySchema = z.object({
  address: z
    .string()
    .regex(/^G[ABCDEFGHIJKLMNOPQRSTUVWXYZ234567]{55}$/)
    .optional(),
});

export async function POST(req: Request) {
  if (getStellarNetwork() !== 'testnet') {
    return NextResponse.json(
      { error: 'Testnet faucet is only available on testnet.' },
      { status: 400 },
    );
  }

  const session = await requireSession(req);
  if (isSessionError(session)) {
    return session;
  }

  try {
    const body = bodySchema.parse(await req.json().catch(() => ({})));
    const address = body.address ?? session.stellarAddress;
    if (address !== session.stellarAddress) {
      return NextResponse.json(
        { error: 'Address must match your signed-in wallet.' },
        { status: 403 },
      );
    }

    const tokens = await getSoroswapTestnetSwapTokens();
    const usdc = await soroswapFaucetMint(address, tokens.usdcSac);

    return NextResponse.json({
      ok: true,
      asset: 'USDC',
      txHash: usdc.txHash,
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : 'Soroswap faucet failed';
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
