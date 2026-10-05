import { NextResponse } from 'next/server';
import {
  resolveStellarNetwork,
  resolveSupabaseApiUrl,
  resolveSupabasePublishableKey,
  resolveSupabaseServiceRoleKey,
} from '@/lib/config/env';
import { getReflectorPulseConfig } from '@/lib/config/network';
import { isSupabaseConfigured } from '@/lib/supabase/server';

export async function GET() {
  const reflector = getReflectorPulseConfig();
  return NextResponse.json({
    network: resolveStellarNetwork(),
    pollar: {
      publishableKey: Boolean(process.env.NEXT_PUBLIC_POLLAR_PUBLISHABLE_KEY),
      secretKey: Boolean(process.env.POLLAR_SECRET_KEY),
    },
    supabase: {
      url: resolveSupabaseApiUrl() ?? null,
      publishableKey: Boolean(resolveSupabasePublishableKey()),
      serviceRoleKey: Boolean(resolveSupabaseServiceRoleKey()),
      serverWritesReady: isSupabaseConfigured(),
    },
    integrations: {
      trustlessWork: Boolean(process.env.TRUSTLESS_WORK_API_KEY),
      reflector: {
        rpcUrl: reflector.rpcUrl,
        contractId: reflector.contractId,
        feedHint: reflector.feedHint,
      },
    },
    hints: [
      !resolveSupabaseServiceRoleKey()
        ? 'Add SUPABASE_SERVICE_ROLE_KEY from Supabase Dashboard → Project Settings → API (server only, never NEXT_PUBLIC_).'
        : null,
      reflector.feedHint === 'dex_or_cex'
        ? 'For supported fiat (CRC, ARS, BOB, CLP, COP, BRL), use testnet FX oracle CCSSOHTBL3LEWUCBBEB5NJFC2OKFRC74OWEIJIZLRJBGAAU4VMU5NV4W or mainnet FX CBKGPWGKSKZF52CFHMTRR23TBWTPMRDIYZ4O2P5VS65BMHYH4DXMCJZC.'
        : null,
      !process.env.UPEER_PLATFORM_ADDRESS
        ? 'Set UPEER_PLATFORM_ADDRESS (G…) for Trustless Work escrow deploy.'
        : null,
    ].filter(Boolean),
  });
}
