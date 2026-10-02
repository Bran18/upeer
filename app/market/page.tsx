import { OfferCard } from '@/components/offer-card';
import { getNetworkConfig } from '@/lib/config/network';
import { listMarketOffers } from '@/lib/data/offers';
import { fetchAssetRating } from '@/lib/stellar-expert/asset';

export default async function MarketPage() {
  const [offers, network] = await Promise.all([
    listMarketOffers(),
    Promise.resolve(getNetworkConfig()),
  ]);

  let usdcRatingAverage: number | undefined;
  try {
    const usdcRating = await fetchAssetRating('USDC', network.usdcIssuer);
    usdcRatingAverage = usdcRating.rating?.average;
  } catch {
    usdcRatingAverage = undefined;
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6">
      <h1 className="text-2xl font-semibold">Market</h1>
      <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
        Verified merchant liquidity. Quotes use Reflector FX references on
        testnet.
      </p>
      <div className="mt-8 space-y-4">
        {offers.map((offer) => (
          <OfferCard
            key={offer.id}
            offer={offer}
            usdcIssuer={network.usdcIssuer}
            usdcRating={usdcRatingAverage}
          />
        ))}
      </div>
    </div>
  );
}
