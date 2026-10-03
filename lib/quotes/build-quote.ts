import { quoteCreateDeadline } from '@/lib/quotes/ttl';

export type BuiltQuote = {
  usdcAmount: string;
  fiatAmount: string;
  fiatCurrency: string;
  pricePerUsdc: string;
  reflectorSnapshot: Record<string, unknown>;
  expiresAt: string;
};

export async function buildExecutableQuote(input: {
  fiatCurrency: string;
  pricePerUsdc: string;
  usdcAmount: string;
}): Promise<BuiltQuote> {
  const usdc = Number(input.usdcAmount);
  const price = Number(input.pricePerUsdc);
  if (!Number.isFinite(usdc) || usdc <= 0) {
    throw new Error('Invalid USDC amount');
  }
  if (!Number.isFinite(price) || price <= 0) {
    throw new Error('Invalid order price');
  }

  const fiatAmount = (usdc * price).toFixed(4);

  return {
    usdcAmount: input.usdcAmount,
    fiatAmount,
    fiatCurrency: input.fiatCurrency,
    pricePerUsdc: input.pricePerUsdc,
    reflectorSnapshot: {
      source: 'offer',
      pricePerUsdc: input.pricePerUsdc,
      fiatCurrency: input.fiatCurrency,
    },
    expiresAt: quoteCreateDeadline().toISOString(),
  };
}
