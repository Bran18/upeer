import {
  SupportedNetworks,
  SupportedProtocols,
  TradeType,
  type BuildQuoteResponse,
  type QuoteResponse,
  type SendTransactionResponse,
} from '@soroswap/sdk';
import { getNetworkConfig } from '@/lib/config/network';
import { getSoroswapSdk, soroswapSdkNetwork } from '@/lib/soroswap/sdk-client';

const SOROSWAP_BASE = 'https://api.soroswap.finance';

/** SDEX routes are incompatible with Soroban smart-wallet accounts (e.g. Pollar). */
const SMART_WALLET_EXCLUDED_PROTOCOLS = new Set(['sdex']);

const KNOWN_PROTOCOLS = new Set<string>(Object.values(SupportedProtocols));

type ProtocolCache = {
  network: 'testnet' | 'mainnet';
  protocols: SupportedProtocols[];
  expiresAt: number;
};

let protocolCache: ProtocolCache | null = null;
const PROTOCOL_CACHE_MS = 5 * 60 * 1000;

function stellarNetworkId(): 'testnet' | 'mainnet' {
  return getNetworkConfig().soroswapNetwork;
}

function sdkNetworkForStellarId(
  network: 'testnet' | 'mainnet',
): SupportedNetworks {
  return network === 'testnet'
    ? SupportedNetworks.TESTNET
    : SupportedNetworks.MAINNET;
}

function apiKey(): string {
  const key = process.env.SOROSWAP_API_KEY;
  if (!key) {
    throw new Error('SOROSWAP_API_KEY is not configured');
  }
  return key;
}

/** Static fallback when /protocols is unreachable (no sdex — smart wallets). */
export function defaultQuoteProtocols(
  network: 'testnet' | 'mainnet',
): SupportedProtocols[] {
  if (network === 'testnet') {
    return [SupportedProtocols.SOROSWAP];
  }
  return [SupportedProtocols.SOROSWAP, SupportedProtocols.AQUA];
}

function toSupportedProtocols(names: string[]): SupportedProtocols[] {
  return names.filter((name) =>
    KNOWN_PROTOCOLS.has(name),
  ) as SupportedProtocols[];
}

async function fetchIndexerProtocols(
  network: 'testnet' | 'mainnet',
): Promise<SupportedProtocols[] | null> {
  const now = Date.now();
  if (
    protocolCache &&
    protocolCache.network === network &&
    protocolCache.expiresAt > now
  ) {
    return protocolCache.protocols;
  }

  try {
    const sdk = getSoroswapSdk();
    const listed = await sdk.getProtocols(sdkNetworkForStellarId(network));
    if (!Array.isArray(listed) || listed.length === 0) {
      return null;
    }
    const protocols = toSupportedProtocols(
      listed.filter((name) => !SMART_WALLET_EXCLUDED_PROTOCOLS.has(name)),
    );
    const resolved =
      protocols.length > 0 ? protocols : [SupportedProtocols.SOROSWAP];
    protocolCache = {
      network,
      protocols: resolved,
      expiresAt: now + PROTOCOL_CACHE_MS,
    };
    return resolved;
  } catch {
    return null;
  }
}

export async function resolveQuoteProtocols(
  network: 'testnet' | 'mainnet',
  override?: string[],
): Promise<SupportedProtocols[]> {
  if (override?.length) {
    return toSupportedProtocols(override);
  }
  const fromApi = await fetchIndexerProtocols(network);
  return fromApi ?? defaultQuoteProtocols(network);
}

function parseSoroswapErrorBody(body: unknown, status: number): string {
  if (body === null || typeof body !== 'object') {
    return `Soroswap error (${status})`;
  }
  const record = body as Record<string, unknown>;
  const detail = record.detail;
  if (typeof detail === 'string' && detail.trim()) {
    return detail;
  }
  const title = record.title;
  if (typeof title === 'string' && title.trim()) {
    return title;
  }
  const message = record.message;
  if (typeof message === 'string' && message.trim()) {
    return message;
  }
  if (Array.isArray(message)) {
    const joined = message
      .map((part) => (typeof part === 'string' ? part : String(part)))
      .filter(Boolean)
      .join('; ');
    if (joined) {
      return joined;
    }
  }
  const error = record.error;
  if (typeof error === 'string' && error.trim()) {
    return error;
  }
  try {
    const serialized = JSON.stringify(body);
    if (serialized && serialized !== '{}') {
      return serialized;
    }
  } catch {
    // ignore
  }
  return `Soroswap error (${status})`;
}

function wrapSoroswapSdkError(error: unknown): Error {
  if (error instanceof Error) {
    return error;
  }
  return new Error(parseSoroswapErrorBody(error, 502));
}

/** JSON-safe copy (SDK quote types may include bigint). */
export function serializeSoroswapJson<T>(value: T): T {
  return JSON.parse(
    JSON.stringify(value, (_key, v) =>
      typeof v === 'bigint' ? v.toString() : v,
    ),
  ) as T;
}

function parseStroops(amount: string): bigint {
  const trimmed = amount.trim();
  if (!/^\d+$/.test(trimmed)) {
    throw new Error('Invalid swap amount');
  }
  return BigInt(trimmed);
}

export type SoroswapQuoteRequest = {
  assetIn: string;
  assetOut: string;
  amount: string;
  tradeType?: 'EXACT_IN' | 'EXACT_OUT';
  protocols?: string[];
  slippageBps?: number;
};

export async function soroswapQuote(
  params: SoroswapQuoteRequest,
): Promise<QuoteResponse> {
  const networkId = stellarNetworkId();
  const protocols = await resolveQuoteProtocols(networkId, params.protocols);
  const sdk = getSoroswapSdk();
  try {
    return await sdk.quote(
      {
        assetIn: params.assetIn,
        assetOut: params.assetOut,
        amount: parseStroops(params.amount),
        tradeType:
          params.tradeType === 'EXACT_OUT'
            ? TradeType.EXACT_OUT
            : TradeType.EXACT_IN,
        protocols,
        slippageBps: params.slippageBps ?? 50,
      },
      soroswapSdkNetwork(),
    );
  } catch (error) {
    throw wrapSoroswapSdkError(error);
  }
}

export async function soroswapBuild(
  quote: unknown,
  from: string,
  to?: string,
): Promise<BuildQuoteResponse> {
  const sdk = getSoroswapSdk();
  try {
    return await sdk.build(
      {
        quote: quote as QuoteResponse,
        from,
        to: to ?? from,
      },
      soroswapSdkNetwork(),
    );
  } catch (error) {
    throw wrapSoroswapSdkError(error);
  }
}

export async function soroswapSend(
  signedXdr: string,
): Promise<SendTransactionResponse> {
  const sdk = getSoroswapSdk();
  try {
    return await sdk.send(signedXdr, soroswapSdkNetwork());
  } catch (error) {
    throw wrapSoroswapSdkError(error);
  }
}

export type SoroswapFaucetResult = {
  status: string;
  txHash: string;
};

/** Testnet only — mints SAC tokens via Soroswap’s faucet (not exposed on SoroswapSDK). */
export async function soroswapFaucetMint(
  address: string,
  contract: string,
): Promise<SoroswapFaucetResult> {
  const url = new URL(`${SOROSWAP_BASE}/api/faucet`);
  url.searchParams.set('address', address);
  url.searchParams.set('contract', contract);
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey()}`,
    },
  });
  let json: unknown;
  try {
    json = await response.json();
  } catch {
    throw new Error(`Soroswap faucet error (${response.status})`);
  }
  if (!response.ok) {
    throw new Error(parseSoroswapErrorBody(json, response.status));
  }
  const record = json as Record<string, unknown>;
  const txHash = record.txHash;
  if (typeof txHash !== 'string') {
    throw new Error('Soroswap faucet returned an unexpected response');
  }
  return {
    status: typeof record.status === 'string' ? record.status : 'SUCCESS',
    txHash,
  };
}
