import { OfferList } from '@/components/market/offer-list';
import { AppPage } from '@/components/ui/app-page';
import { DirectionalTransition } from '@/components/transition/directional-transition';
import { getNetworkConfig } from '@/lib/config/network';
import { listMarketOffers } from '@/lib/data/offers';
import { parseMarketFilters } from '@/lib/market/filters';
import { fetchAssetRating } from '@/lib/stellar-expert/asset';

type PageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function MarketPage({ searchParams }: PageProps) {
  const [offers, network, params] = await Promise.all([
    listMarketOffers(),
    Promise.resolve(getNetworkConfig()),
    searchParams,
  ]);

  const initialFilters = parseMarketFilters(params);

  let usdcRatingAverage: number | undefined;
  try {
    const usdcRating = await fetchAssetRating('USDC', network.usdcIssuer);
    usdcRatingAverage = usdcRating.rating?.average;
  } catch {
    usdcRatingAverage = undefined;
  }

  return (
    <DirectionalTransition>
      <AppPage width="content" className="!pt-8 sm:!pt-10">
        <header className="mb-8 max-w-2xl">
          <p className="text-[0.6875rem] font-medium uppercase tracking-[0.28em] text-[var(--foreground-tertiary)]">
            Open orders
          </p>
          <h1 className="mt-2 text-[clamp(1.75rem,4vw,2.5rem)] font-medium tracking-[-0.03em] text-balance">
            Market
          </h1>
          <p className="mt-3 text-[0.9375rem] leading-relaxed text-[var(--foreground-secondary)] text-pretty">
            Each row is an order at a set price per USDC. Take one or post your
            own from the merchant console.
          </p>
        </header>
        <OfferList
          offers={offers}
          usdcIssuer={network.usdcIssuer}
          usdcRating={usdcRatingAverage}
          initialFilters={initialFilters}
        />
      </AppPage>
    </DirectionalTransition>
  );
}
