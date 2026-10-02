import { getSupabaseAdmin, isSupabaseConfigured } from '@/lib/supabase/server';

export type MarketOffer = {
  id: string;
  merchantName: string;
  side: 'sell_usdc' | 'buy_usdc';
  fiatCurrency: string;
  spreadBps: number;
  minUsdc: string;
  maxUsdc: string;
  availableUsdc: string;
  verified: boolean;
};

export const MOCK_OFFERS: MarketOffer[] = [
  {
    id: 'demo-offer-1',
    merchantName: 'Andes Liquidity',
    side: 'sell_usdc',
    fiatCurrency: 'COP',
    spreadBps: 45,
    minUsdc: '50.0000000',
    maxUsdc: '5000.0000000',
    availableUsdc: '12000.0000000',
    verified: true,
  },
  {
    id: 'demo-offer-2',
    merchantName: 'MXN Desk',
    side: 'buy_usdc',
    fiatCurrency: 'MXN',
    spreadBps: 30,
    minUsdc: '100.0000000',
    maxUsdc: '10000.0000000',
    availableUsdc: '25000.0000000',
    verified: true,
  },
];

export async function listMarketOffers(): Promise<MarketOffer[]> {
  if (!isSupabaseConfigured()) {
    return MOCK_OFFERS;
  }

  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from('offers')
    .select(
      `
      id,
      side,
      fiat_currency,
      spread_bps,
      min_usdc,
      max_usdc,
      available_usdc,
      merchants!inner (
        display_name,
        status
      )
    `,
    )
    .eq('status', 'open')
    .eq('merchants.status', 'approved');

  if (error || !data?.length) {
    return MOCK_OFFERS;
  }

  return data.map((row) => {
    const rawMerchant = row.merchants;
    const merchant = (Array.isArray(rawMerchant)
      ? rawMerchant[0]
      : rawMerchant) as { display_name: string; status: string };
    return {
      id: row.id,
      merchantName: merchant.display_name,
      side: row.side as 'sell_usdc' | 'buy_usdc',
      fiatCurrency: row.fiat_currency,
      spreadBps: row.spread_bps,
      minUsdc: String(row.min_usdc),
      maxUsdc: String(row.max_usdc),
      availableUsdc: String(row.available_usdc),
      verified: merchant.status === 'approved',
    };
  });
}

export async function getOfferById(id: string): Promise<MarketOffer | null> {
  if (isSupabaseConfigured() && id.includes('-')) {
    const supabase = getSupabaseAdmin();
    const { data, error } = await supabase
      .from('offers')
      .select(
        `
        id,
        side,
        fiat_currency,
        spread_bps,
        min_usdc,
        max_usdc,
        available_usdc,
        status,
        merchants!inner (display_name, status)
      `,
      )
      .eq('id', id)
      .eq('status', 'open')
      .maybeSingle();

    if (!error && data) {
      const rawMerchant = data.merchants;
      const merchant = (Array.isArray(rawMerchant)
        ? rawMerchant[0]
        : rawMerchant) as { display_name: string; status: string };
      return {
        id: data.id,
        merchantName: merchant.display_name,
        side: data.side as 'sell_usdc' | 'buy_usdc',
        fiatCurrency: data.fiat_currency,
        spreadBps: data.spread_bps,
        minUsdc: String(data.min_usdc),
        maxUsdc: String(data.max_usdc),
        availableUsdc: String(data.available_usdc),
        verified: merchant.status === 'approved',
      };
    }
  }

  const offers = await listMarketOffers();
  return offers.find((o) => o.id === id) ?? null;
}
