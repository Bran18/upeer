export type OfferSide = 'sell_usdc' | 'buy_usdc';

export type P2pLegInput = {
  side: OfferSide;
  makerProfileId: string;
  takerProfileId: string;
  makerPayoutAddress: string | null;
  takerStellarAddress: string | null;
};

export type P2pLegs = {
  usdcSellerProfileId: string;
  usdcBuyerProfileId: string;
  usdcSellerAddress: string | null;
  usdcBuyerAddress: string | null;
};

/** USDC seller deploys/funds/approves/releases; USDC buyer sends fiat and receives USDC. */
export function p2pLegs(input: P2pLegInput): P2pLegs {
  const isSell = input.side === 'sell_usdc';
  const usdcSellerProfileId = isSell
    ? input.makerProfileId
    : input.takerProfileId;
  const usdcBuyerProfileId = isSell
    ? input.takerProfileId
    : input.makerProfileId;
  const usdcSellerAddress = isSell
    ? input.makerPayoutAddress
    : input.takerStellarAddress;
  const usdcBuyerAddress = isSell
    ? input.takerStellarAddress
    : input.makerPayoutAddress;

  return {
    usdcSellerProfileId,
    usdcBuyerProfileId,
    usdcSellerAddress,
    usdcBuyerAddress,
  };
}

export function isUsdcSellerProfile(
  input: P2pLegInput,
  profileId: string,
): boolean {
  return p2pLegs(input).usdcSellerProfileId === profileId;
}

export function isUsdcBuyerProfile(
  input: P2pLegInput,
  profileId: string,
): boolean {
  return p2pLegs(input).usdcBuyerProfileId === profileId;
}
