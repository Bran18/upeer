import { ViewTransition } from 'react';
import { notFound } from 'next/navigation';
import { TradeFlowClient } from '@/components/trade-flow-client';
import { DirectionalTransition } from '@/components/transition/directional-transition';
import { NavLink } from '@/components/transition/nav-link';
import { AppPage } from '@/components/ui/app-page';
import { getOfferById } from '@/lib/data/offers';

type Props = { params: Promise<{ offerId: string }> };

export default async function TradePage({ params }: Props) {
  const { offerId } = await params;
  const offer = await getOfferById(offerId);
  if (!offer) {
    notFound();
  }

  return (
    <DirectionalTransition>
      <AppPage width="narrow">
        <NavLink
          href="/market"
          direction="back"
          className="text-sm font-medium text-[var(--accent)] hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent)]"
        >
          ← Back to Market
        </NavLink>
        <ViewTransition
          name={`merchant-${offer.id}`}
          share="morph"
          default="none"
        >
          <h1 className="text-title-2 mt-6 text-balance">
            Trade with {offer.merchantName}
          </h1>
        </ViewTransition>
        <p className="text-body mt-3 text-[0.9375rem] text-pretty">
          {offer.side === 'sell_usdc'
            ? 'Sell order — you buy USDC at their listed price and pay fiat P2P.'
            : 'Buy order — you sell USDC at their listed price and receive fiat P2P.'}
        </p>
        <div className="panel-card mt-8 sm:mt-10">
          <TradeFlowClient offer={offer} />
        </div>
      </AppPage>
    </DirectionalTransition>
  );
}
