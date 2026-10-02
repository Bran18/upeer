import { OfferList } from '@/components/market/offer-list';
import { DirectionalTransition } from '@/components/transition/directional-transition';
import { PageHeader } from '@/components/ui/page-header';
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
    <DirectionalTransition>
      <div className="mx-auto max-w-[980px] px-6 py-16 sm:py-20">
        <PageHeader
          eyebrow="Liquidity"
          title="Live OTC offers"
          description="Verified merchants on testnet. Quotes lock Reflector references plus spread before you fund escrow."
        />
        <OfferList
          offers={offers}
          usdcIssuer={network.usdcIssuer}
          usdcRating={usdcRatingAverage}
        />
      </div>
    </DirectionalTransition>
  );
}
