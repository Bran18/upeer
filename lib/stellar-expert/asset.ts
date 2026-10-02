import { getStellarNetwork } from '@/lib/config/network';

export type AssetRating = {
  asset: string;
  rating?: {
    average?: number;
    liquidity?: number;
    volume7d?: number;
  };
};

export async function fetchAssetRating(
  assetCode: string,
  issuer: string,
): Promise<AssetRating> {
  const network = getStellarNetwork();
  const explorer = network === 'mainnet' ? 'public' : 'testnet';
  const assetId = `${assetCode}-${issuer}`;
  const url = `https://api.stellar.expert/explorer/${explorer}/asset/${assetId}`;
  const res = await fetch(url, {
    headers: { Accept: 'application/json' },
    next: { revalidate: 3600 },
  });
  if (!res.ok) {
    return { asset: assetId };
  }
  const data = (await res.json()) as {
    rating?: AssetRating['rating'];
  };
  return { asset: assetId, rating: data.rating };
}
