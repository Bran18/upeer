import Link from 'next/link';
import { notFound } from 'next/navigation';
import { TradeFlowClient } from '@/components/trade-flow-client';
import { getOfferById } from '@/lib/data/offers';

type Props = { params: Promise<{ offerId: string }> };

export default async function TradePage({ params }: Props) {
  const { offerId } = await params;
  const offer = await getOfferById(offerId);
  if (!offer) {
    notFound();
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6">
      <Link
        href="/market"
        className="text-sm text-emerald-700 hover:underline dark:text-emerald-400"
      >
        ← Back to market
      </Link>
      <h1 className="mt-4 text-2xl font-semibold">
        Trade with {offer.merchantName}
      </h1>
      <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
        {offer.side === 'sell_usdc'
          ? 'You buy USDC and pay fiat to the merchant.'
          : 'You sell USDC and receive fiat from the merchant.'}
      </p>
      <div className="mt-8">
        <TradeFlowClient offer={offer} />
      </div>
    </div>
  );
}
