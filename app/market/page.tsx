import Link from 'next/link';
import { OfferList } from '@/components/market/offer-list';
import { MarketStats } from '@/components/market/market-stats';
import { AppPage } from '@/components/ui/app-page';
import { DirectionalTransition } from '@/components/transition/directional-transition';
import { listMarketOffers } from '@/lib/data/offers';
import { parseMarketFilters } from '@/lib/market/filters';
import { summarizeMarket } from '@/lib/market/summary';

type PageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function MarketPage({ searchParams }: PageProps) {
  const [offers, params] = await Promise.all([
    listMarketOffers(),
    searchParams,
  ]);

  const initialFilters = parseMarketFilters(params);
  const summary = summarizeMarket(offers);

  return (
    <DirectionalTransition>
      <AppPage width="wide" className="!pt-8 sm:!pt-10">
        <header className="mb-8 flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
          <div className="max-w-2xl min-w-0">
            <p className="text-[0.6875rem] font-medium uppercase tracking-[0.28em] text-[var(--foreground-tertiary)]">
              P2P book
            </p>
            <h1 className="mt-2 text-[clamp(1.75rem,4vw,2.5rem)] font-medium tracking-[-0.03em] text-balance">
              Open Offers
            </h1>
            <p className="mt-3 text-[0.9375rem] leading-relaxed text-[var(--foreground-secondary)] text-pretty">
              Compare live desks and take a posted price. Escrow is on-chain;
              fiat settles peer to peer.
            </p>
          </div>
          <Link
            href="/orders/new"
            className="btn-primary shrink-0 self-start sm:self-auto"
          >
            Post Order
          </Link>
        </header>
        <MarketStats summary={summary} />
        <OfferList offers={offers} initialFilters={initialFilters} />
      </AppPage>
    </DirectionalTransition>
  );
}
