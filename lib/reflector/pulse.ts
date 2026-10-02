import { PulseClient, type Asset } from '@reflector/contract-client';
import {
  DEFAULT_LATAM_SYMBOLS,
  getReflectorPulseConfig,
  REFLECTOR_PULSE_DEFAULT_RESOLUTION_SECONDS,
} from '@/lib/config/network';

export type FxQuoteSnapshot = {
  symbol: string;
  price: string;
  rawPrice: string;
  decimals: number;
  timestamp: string;
  ageSeconds: number;
  stale: boolean;
};

export type PulseReadResult = {
  contractId: string;
  rpcUrl: string;
  baseAsset: string;
  resolutionSeconds: number;
  quotes: FxQuoteSnapshot[];
  quotedAssets: string[];
  feedHint: 'fx' | 'dex_or_cex' | 'unknown';
};

const DEFAULT_SIMULATION_PUBLIC_KEY =
  'GAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAWHF';

function resolveSimulationPublicKey(): string {
  const fromEnv = process.env.REFLECTOR_PUBLIC_KEY?.trim();
  if (!fromEnv) {
    return DEFAULT_SIMULATION_PUBLIC_KEY;
  }
  if (!fromEnv.startsWith('G') || fromEnv.length !== 56) {
    throw new Error('REFLECTOR_PUBLIC_KEY must be a Stellar G… public key');
  }
  return fromEnv;
}

function formatAsset(asset: Asset): string {
  if (asset.tag === 'Other') {
    return asset.values[0];
  }
  return `Stellar:${asset.values[0]}`;
}

function assetSymbol(asset: Asset): string {
  return asset.values[0];
}

let assetsCache: { at: number; symbols: Set<string> } | null = null;
const ASSETS_CACHE_MS = 5 * 60 * 1000;

export async function readPulseFxReference(
  symbols: readonly string[] = DEFAULT_LATAM_SYMBOLS,
): Promise<PulseReadResult> {
  const reflector = getReflectorPulseConfig();
  const publicKey = resolveSimulationPublicKey();

  const client = new PulseClient({
    publicKey,
    rpcUrl: reflector.rpcUrl,
    contractId: reflector.contractId,
    networkPassphrase: reflector.networkPassphrase,
  });

  const [decimals, resolution, base, assets] = await Promise.all([
    client.decimals(),
    client.resolution(),
    client.base(),
    client.assets(),
  ]);

  const now = Date.now();
  if (!assetsCache || now - assetsCache.at > ASSETS_CACHE_MS) {
    assetsCache = {
      at: now,
      symbols: new Set(assets.map(assetSymbol)),
    };
  }
  const available = assetsCache.symbols;

  const nowSec = Math.floor(Date.now() / 1000);
  const maxAge = resolution ?? REFLECTOR_PULSE_DEFAULT_RESOLUTION_SECONDS;
  const scale = BigInt(10) ** BigInt(decimals);

  const quotes: FxQuoteSnapshot[] = [];
  for (const symbol of symbols) {
    if (!available.has(symbol)) {
      continue;
    }
    const last = await client.lastPrice(symbol);
    if (!last) {
      continue;
    }
    const ageSeconds = nowSec - Number(last.timestamp);
    const stale = ageSeconds > maxAge;
    const scaled = Number(last.price) / Number(scale);
    quotes.push({
      symbol,
      price: scaled.toFixed(Math.min(decimals, 8)),
      rawPrice: last.price.toString(),
      decimals,
      timestamp: new Date(Number(last.timestamp) * 1000).toISOString(),
      ageSeconds,
      stale,
    });
  }

  return {
    contractId: reflector.contractId,
    rpcUrl: reflector.rpcUrl,
    baseAsset: formatAsset(base),
    resolutionSeconds: maxAge,
    quotes,
    quotedAssets: [...available].sort(),
    feedHint: reflector.feedHint,
  };
}
