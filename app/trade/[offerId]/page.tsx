import { notFound } from 'next/navigation';
import { TradeFlowClient } from '@/components/trade-flow-client';
import { TradeOfferSummary } from '@/components/trade/trade-offer-summary';
import { DirectionalTransition } from '@/components/transition/directional-transition';
import { NavLink } from '@/components/transition/nav-link';
import { AppPage } from '@/components/ui/app-page';
import { getOfferById } from '@/lib/data/offers';
import { buyerActionLabel } from '@/lib/market/format';

type Props = {
  params: Promise<{ offerId: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function TradePage({ params, searchParams }: Props) {
  const [{ offerId }, query] = await Promise.all([params, searchParams]);
  const offer = await getOfferById(offerId);
  if (!offer) {
    notFound();
  }

  const usdcRaw = query.usdc;
  const initialUsdc = typeof usdcRaw === 'string' ? usdcRaw : undefined;
  const action = buyerActionLabel(offer.side);

  return (
    <DirectionalTransition>
      <AppPage width="content">
        <NavLink
          href="/market"
          direction="back"
          className="text-sm font-medium text-[var(--accent)] hover:text-[var(--accent-hover)] hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent)]"
        >
          ← Back to Market
        </NavLink>
        <h1 className="text-title-2 mt-6 text-balance scroll-mt-[var(--site-header-height)]">
          {action} with {offer.merchantName}
        </h1>
        <p className="text-body mt-3 max-w-xl text-[0.9375rem] text-pretty">
          Review the posted price, choose a size, then request the trade.
        </p>
        <div className="mt-8 grid gap-4 lg:mt-10 lg:grid-cols-[minmax(0,1.05fr)_minmax(20rem,0.95fr)] lg:items-start">
          <TradeOfferSummary offer={offer} />
          <TradeFlowClient offer={offer} initialUsdc={initialUsdc} />
        </div>
      </AppPage>
    </DirectionalTransition>
  );
}
