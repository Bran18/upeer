import { readPulseFxReference } from '@/lib/reflector/pulse';

const QUOTE_TTL_MS = 5 * 60 * 1000;

export type BuiltQuote = {
  usdcAmount: string;
  fiatAmount: string;
  fiatCurrency: string;
  spreadBps: number;
  referencePrice: string;
  reflectorSnapshot: Record<string, unknown>;
  expiresAt: string;
};

export async function buildExecutableQuote(input: {
  fiatCurrency: string;
  spreadBps: number;
  usdcAmount: string;
}): Promise<BuiltQuote> {
  const usdc = Number(input.usdcAmount);
  if (!Number.isFinite(usdc) || usdc <= 0) {
    throw new Error('Invalid USDC amount');
  }

  const pulse = await readPulseFxReference([input.fiatCurrency]);
  const fx = pulse.quotes.find((q) => q.symbol === input.fiatCurrency);
  if (!fx || fx.stale) {
    throw new Error(
      `No fresh Reflector price for ${input.fiatCurrency}. Check REFLECTOR_PULSE_CONTRACT_ID (use FX oracle for fiat).`,
    );
  }

  const ref = Number(fx.price);
  const spread = 1 + input.spreadBps / 10000;
  const fiatAmount = (usdc * ref * spread).toFixed(4);

  return {
    usdcAmount: input.usdcAmount,
    fiatAmount,
    fiatCurrency: input.fiatCurrency,
    spreadBps: input.spreadBps,
    referencePrice: fx.price,
    reflectorSnapshot: {
      contractId: pulse.contractId,
      symbol: fx.symbol,
      price: fx.price,
      rawPrice: fx.rawPrice,
      decimals: fx.decimals,
      timestamp: fx.timestamp,
      feedHint: pulse.feedHint,
    },
    expiresAt: new Date(Date.now() + QUOTE_TTL_MS).toISOString(),
  };
}
