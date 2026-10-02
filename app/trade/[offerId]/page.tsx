import { ViewTransition } from 'react';
import { notFound } from 'next/navigation';
import { TradeFlowClient } from '@/components/trade-flow-client';
import { DirectionalTransition } from '@/components/transition/directional-transition';
import { NavLink } from '@/components/transition/nav-link';
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
      <div className="mx-auto max-w-3xl px-4 py-14 sm:px-6">
        <NavLink
          href="/market"
          direction="back"
          className="text-sm font-medium text-[var(--accent)] hover:underline"
        >
          ← Back to market
        </NavLink>
        <ViewTransition
          name={`merchant-${offer.id}`}
          share="morph"
          default="none"
        >
          <h1 className="mt-6 font-[family-name:var(--font-display)] text-3xl font-bold tracking-tight">
            Trade with {offer.merchantName}
          </h1>
        </ViewTransition>
        <p className="mt-3 text-sm text-[var(--muted)]">
          {offer.side === 'sell_usdc'
            ? 'You buy USDC and settle fiat with the merchant.'
            : 'You sell USDC and receive fiat from the merchant.'}
        </p>
        <div className="mt-10 glass-panel p-6 sm:p-8">
          <TradeFlowClient offer={offer} />
        </div>
      </div>
    </DirectionalTransition>
  );
}
