export type MerchantRecord = {
  id: string;
  status: string;
  display_name: string;
  payout_address: string | null;
  created_at?: string;
};

export type MerchantOfferRow = {
  id: string;
  side: 'sell_usdc' | 'buy_usdc';
  fiat_currency: string;
  price_per_usdc: string | number;
  min_usdc: string | number;
  max_usdc: string | number;
  available_usdc: string | number;
  status: string;
  created_at: string;
};
