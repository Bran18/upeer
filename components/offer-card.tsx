import Link from 'next/link';
import type { MarketOffer } from '@/lib/data/offers';
import { AssetBadge } from '@/components/asset-badge';

type Props = {
  offer: MarketOffer;
  usdcRating?: number;
  usdcIssuer: string;
};

export function OfferCard({ offer, usdcRating, usdcIssuer }: Props) {
  const sideLabel =
    offer.side === 'sell_usdc' ? 'Merchant sells USDC' : 'Merchant buys USDC';

  return (
    <article className="rounded-xl border border-zinc-200 bg-white p-5 shadow-sm transition hover:border-emerald-500/40 dark:border-zinc-800 dark:bg-zinc-900">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="font-semibold">{offer.merchantName}</h2>
          <p className="text-sm text-zinc-500">{sideLabel}</p>
        </div>
        {offer.verified ? (
          <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-medium text-emerald-800 dark:bg-emerald-900/50 dark:text-emerald-200">
            Verified
          </span>
        ) : null}
      </div>
      <div className="mt-4 flex flex-wrap items-center gap-2 text-sm">
        <AssetBadge code="USDC" issuer={usdcIssuer} ratingAverage={usdcRating} />
        <span className="text-zinc-600 dark:text-zinc-400">
          Fiat: {offer.fiatCurrency} · spread {offer.spreadBps} bps
        </span>
      </div>
      <p className="mt-3 text-sm tabular-nums text-zinc-600 dark:text-zinc-400">
        {offer.minUsdc} – {offer.maxUsdc} USDC · {offer.availableUsdc} available
      </p>
      <Link
        href={`/trade/${offer.id}`}
        className="mt-4 inline-flex rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700"
      >
        Start trade
      </Link>
    </article>
  );
}
