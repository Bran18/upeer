const SOROSWAP_TOKENS_URL = 'https://api.soroswap.finance/api/tokens';

const FALLBACK_XLM =
  'CDLZFC3SYJYDZT7K67VZ75HPJVIEUVNIXF47ZG2FB2RMQQVU2HHGCYSC';
const FALLBACK_USDC =
  'CB3TLW74NBIOT3BUWOZ3TUM6RFDF6A4GVIRUQRQZABG5KPOUL4JJOV2F';

type TokenListResponse = Array<{
  network: string;
  assets: Array<{ code: string; contract: string }>;
}>;

let cache: { xlmSac: string; usdcSac: string; expiresAt: number } | null = null;
const CACHE_MS = 10 * 60 * 1000;

/** Current Soroswap testnet SAC addresses (quickstart docs can lag behind /api/tokens). */
export async function getSoroswapTestnetSwapTokens(): Promise<{
  xlmSac: string;
  usdcSac: string;
}> {
  const now = Date.now();
  if (cache && cache.expiresAt > now) {
    return { xlmSac: cache.xlmSac, usdcSac: cache.usdcSac };
  }

  try {
    const response = await fetch(SOROSWAP_TOKENS_URL);
    if (!response.ok) {
      throw new Error(`tokens ${response.status}`);
    }
    const data = (await response.json()) as TokenListResponse;
    const testnet = data.find((entry) => entry.network === 'testnet');
    const xlm = testnet?.assets.find((a) => a.code === 'XLM');
    const usdc = testnet?.assets.find((a) => a.code === 'USDC');
    if (xlm?.contract && usdc?.contract) {
      cache = {
        xlmSac: xlm.contract,
        usdcSac: usdc.contract,
        expiresAt: now + CACHE_MS,
      };
      return { xlmSac: xlm.contract, usdcSac: usdc.contract };
    }
  } catch {
    // use fallbacks
  }

  return { xlmSac: FALLBACK_XLM, usdcSac: FALLBACK_USDC };
}
