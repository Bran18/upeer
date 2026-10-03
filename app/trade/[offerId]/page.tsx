import { ViewTransition } from 'react';
import { notFound } from 'next/navigation';
import { TradeFlowClient } from '@/components/trade-flow-client';
import { DirectionalTransition } from '@/components/transition/directional-transition';
import { NavLink } from '@/components/transition/nav-link';
import { AppPage } from '@/components/ui/app-page';
import { getOfferById } from '@/lib/data/offers';

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

  return (
    <DirectionalTransition>
      <AppPage width="narrow">
        <NavLink
          href="/exchange"
          direction="back"
          className="text-sm font-medium text-[var(--accent)] hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent)]"
        >
          ← Back to Exchange
        </NavLink>
        <ViewTransition
          name={`merchant-${offer.id}`}
          share="morph"
          default="none"
        >
          <h1 className="text-title-2 mt-6 text-balance">
            Confirm your exchange
          </h1>
        </ViewTransition>
        <p className="text-body mt-3 text-[0.9375rem] text-pretty">
          Matched with {offer.merchantName}. Review the quote, then continue.
        </p>
        <div className="panel-card mt-8 sm:mt-10">
          <TradeFlowClient offer={offer} initialUsdc={initialUsdc} />
        </div>
      </AppPage>
    </DirectionalTransition>
  );
}
