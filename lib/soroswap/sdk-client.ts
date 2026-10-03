import { SoroswapSDK, SupportedNetworks } from '@soroswap/sdk';
import { getNetworkConfig } from '@/lib/config/network';

let cached: SoroswapSDK | null = null;

function apiKey(): string {
  const key = process.env.SOROSWAP_API_KEY;
  if (!key) {
    throw new Error('SOROSWAP_API_KEY is not configured');
  }
  return key;
}

export function soroswapSdkNetwork(): SupportedNetworks {
  return getNetworkConfig().soroswapNetwork === 'testnet'
    ? SupportedNetworks.TESTNET
    : SupportedNetworks.MAINNET;
}

/** Server-only Soroswap SDK (API key never exposed to the browser). */
export function getSoroswapSdk(): SoroswapSDK {
  if (!cached) {
    const baseUrl = process.env.SOROSWAP_API_URL;
    cached = new SoroswapSDK({
      apiKey: apiKey(),
      defaultNetwork: soroswapSdkNetwork(),
      ...(baseUrl ? { baseUrl } : {}),
    });
  }
  return cached;
}
