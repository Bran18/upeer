import type { SettlementAsset } from '@/lib/settlement/assets';

export type PostOrderSide = 'sell_usdc' | 'buy_usdc';

export type PostOrderStep = 1 | 2 | 3 | 4;

export type PostOrderSizeValues = {
  availableUsdc: string;
  minUsdc: string;
  maxUsdc: string;
};

export type PostOrderFormState = {
  side: PostOrderSide;
  settlementAsset: SettlementAsset;
  fiatCurrency: string;
  pricePerUsdc: string;
  minUsdc: string;
  maxUsdc: string;
  availableUsdc: string;
  payoutAddress: string;
};
