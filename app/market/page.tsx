import Link from 'next/link';
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
        <header className="mb-8 flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
          <div className="max-w-2xl">
            <p className="text-[0.6875rem] font-medium uppercase tracking-[0.28em] text-[var(--foreground-tertiary)]">
              Offers
            </p>
            <h1 className="mt-2 text-[clamp(1.75rem,4vw,2.5rem)] font-medium tracking-[-0.03em] text-balance">
              Open offers
            </h1>
            <p className="mt-3 text-[0.9375rem] leading-relaxed text-[var(--foreground-secondary)] text-pretty">
              Optional. Most people start from Exchange and let upeer match
              liquidity. Browse here if you want to pick a merchant yourself.
            </p>
          </div>
          <Link href="/orders/new" className="btn-primary shrink-0 self-start sm:self-auto">
            Post order
          </Link>
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
