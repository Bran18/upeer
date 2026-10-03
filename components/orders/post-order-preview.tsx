'use client';

import {
  buyerActionDescription,
  formatPricePerUsdc,
  formatUsdcAmount,
  orderSideLabel,
} from '@/lib/market/format';
import { marketForCurrency } from '@/lib/fiat/coverage';
import type { PostOrderSide } from '@/components/orders/post-order-side-pills';

type Props = {
  side: PostOrderSide;
  fiatCurrency: string;
  pricePerUsdc: string;
  minUsdc: string;
  maxUsdc: string;
  availableUsdc: string;
  payoutReady: boolean;
  fiatReady: boolean;
};

export function PostOrderPreview({
  side,
  fiatCurrency,
  pricePerUsdc,
  minUsdc,
  maxUsdc,
  availableUsdc,
  payoutReady,
  fiatReady,
}: Props) {
  const market = marketForCurrency(fiatCurrency);
  const priceLabel = formatPricePerUsdc(fiatCurrency, pricePerUsdc);

  return (
    <aside
      className="ui-card space-y-4 px-5 py-5 sm:px-6"
      aria-labelledby="post-order-preview-title"
    >
      <div>
        <p
          id="post-order-preview-title"
          className="text-xs font-medium uppercase tracking-[0.14em] text-[var(--foreground-tertiary)]"
        >
          Market preview
        </p>
        <p className="mt-2 text-lg font-medium tracking-tight text-[var(--foreground)]">
          {orderSideLabel(side)}
        </p>
        <p className="mt-1 text-sm text-[var(--foreground-secondary)] text-pretty">
          {buyerActionDescription(side)}
        </p>
      </div>

      <dl className="space-y-3 text-sm">
        <div className="flex justify-between gap-4">
          <dt className="text-[var(--foreground-tertiary)]">Market</dt>
          <dd className="text-right font-medium text-[var(--foreground)]">
            {market ? `${market.name} · ${market.currency}` : fiatCurrency}
          </dd>
        </div>
        <div className="flex justify-between gap-4">
          <dt className="text-[var(--foreground-tertiary)]">Price</dt>
          <dd className="text-right font-medium tabular-nums text-[var(--foreground)]">
            {priceLabel}
          </dd>
        </div>
        <div className="flex justify-between gap-4">
          <dt className="text-[var(--foreground-tertiary)]">Listed size</dt>
          <dd className="text-right font-medium tabular-nums text-[var(--foreground)]">
            {formatUsdcAmount(availableUsdc)} USDC
          </dd>
        </div>
        <div className="flex justify-between gap-4">
          <dt className="text-[var(--foreground-tertiary)]">Per trade</dt>
          <dd className="text-right font-medium tabular-nums text-[var(--foreground)]">
            {formatUsdcAmount(minUsdc)} – {formatUsdcAmount(maxUsdc)} USDC
          </dd>
        </div>
      </dl>

      <ul className="space-y-2 border-t border-[var(--line)] pt-4 text-xs text-[var(--foreground-secondary)]">
        <li className={payoutReady ? 'text-[var(--foreground-secondary)]' : 'text-amber-700 dark:text-amber-300'}>
          {payoutReady
            ? 'USDC payout address is set for escrow release.'
            : 'Add a Stellar payout address before posting.'}
        </li>
        {side === 'sell_usdc' ? (
          <li className={fiatReady ? 'text-[var(--foreground-secondary)]' : 'text-amber-700 dark:text-amber-300'}>
            {fiatReady
              ? 'Fiat instructions are saved for this currency.'
              : 'Add fiat payment details so buyers know how to pay you.'}
          </li>
        ) : null}
      </ul>
    </aside>
  );
}
