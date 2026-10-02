import { MarketHero } from '@/components/market/market-hero';
import { OfferList } from '@/components/market/offer-list';
import { AppPage } from '@/components/ui/app-page';
import { DirectionalTransition } from '@/components/transition/directional-transition';
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
      <MarketHero offerCount={offers.length} />
      <AppPage width="content" className="!pt-10 sm:!pt-14">
        <OfferList
          offers={offers}
          usdcIssuer={network.usdcIssuer}
          usdcRating={usdcRatingAverage}
        />
      </AppPage>
    </DirectionalTransition>
  );
}
