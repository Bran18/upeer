import { getNetworkConfig } from '@/lib/config/network';

const SOROSWAP_BASE = 'https://api.soroswap.finance';

function apiKey(): string {
  const key = process.env.SOROSWAP_API_KEY;
  if (!key) {
    throw new Error('SOROSWAP_API_KEY is not configured');
  }
  return key;
}

async function soroswapPost<T>(
  endpoint: string,
  data: Record<string, unknown>,
): Promise<T> {
  const network = getNetworkConfig().soroswapNetwork;
  const response = await fetch(`${SOROSWAP_BASE}${endpoint}?network=${network}`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey()}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });
  const json = (await response.json()) as T & { message?: string };
  if (!response.ok) {
    throw new Error(json.message ?? `Soroswap error (${response.status})`);
  }
  return json;
}

export type SoroswapQuoteRequest = {
  assetIn: string;
  assetOut: string;
  amount: string;
  tradeType?: 'EXACT_IN' | 'EXACT_OUT';
  protocols?: string[];
  slippageBps?: number;
};

export async function soroswapQuote(params: SoroswapQuoteRequest) {
  return soroswapPost('/quote', {
    ...params,
    tradeType: params.tradeType ?? 'EXACT_IN',
    protocols: params.protocols ?? ['soroswap', 'phoenix', 'aqua'],
  });
}

export async function soroswapBuild(
  quote: unknown,
  from: string,
  to?: string,
) {
  return soroswapPost<{ xdr: string }>('/quote/build', {
    quote,
    from,
    to: to ?? from,
  });
}

export async function soroswapSend(signedXdr: string) {
  return soroswapPost('/send', { xdr: signedXdr });
}
