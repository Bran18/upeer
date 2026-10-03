import Link from 'next/link';
import {
  formatPricePerUsdc,
  formatUsdcLabel,
  orderSideLabel,
} from '@/lib/market/format';
import type { MerchantOfferRow } from '@/lib/merchant/types';
import { NavLink } from '@/components/transition/nav-link';

function offerStatusLabel(status: string): string {
  if (status === 'open') {
    return 'Live';
  }
  if (status === 'paused') {
    return 'Paused';
  }
  if (status === 'closed') {
    return 'Closed';
  }
  return status;
}

export function MerchantOfferRow({ offer }: { offer: MerchantOfferRow }) {
  const price = formatPricePerUsdc(offer.fiat_currency, offer.price_per_usdc);
  const size = formatUsdcLabel(offer.available_usdc);

  return (
    <li>
      <NavLink
        href={`/trade/${offer.id}`}
        direction="forward"
        className="flex flex-col gap-2 rounded-[var(--radius-ui)] border border-[var(--line)] px-4 py-3 no-underline transition-[border-color] duration-200 hover:border-[var(--accent)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent)] sm:flex-row sm:items-center sm:justify-between"
      >
        <div className="min-w-0">
          <p className="text-sm font-medium">
            {orderSideLabel(offer.side)} · {price}
            <span className="text-[var(--foreground-tertiary)]"> / USDC</span>
          </p>
          <p className="mt-1 text-xs text-[var(--foreground-secondary)]">
            {size} available · min {formatUsdcLabel(offer.min_usdc)}
          </p>
        </div>
        <p className="text-xs font-medium uppercase tracking-[0.12em] text-[var(--foreground-tertiary)]">
          {offerStatusLabel(offer.status)}
        </p>
      </NavLink>
    </li>
  );
}

export function MerchantOffersEmpty({ canPost }: { canPost: boolean }) {
  return (
    <div className="rounded-[var(--radius-ui)] border border-dashed border-[var(--line)] px-5 py-8 text-center">
      <p className="text-sm font-medium">No orders on the book yet</p>
      <p className="mx-auto mt-2 max-w-sm text-sm leading-relaxed text-[var(--foreground-secondary)] text-pretty">
        {canPost
          ? 'Post a sell or buy order at your price. Takers find it on Market.'
          : 'Once this desk is verified, post from here. Payment rails can be set now.'}
      </p>
      {canPost ? (
        <Link href="/orders/new" className="btn-primary mt-5 inline-flex">
          Post order
        </Link>
      ) : null}
    </div>
  );
}
