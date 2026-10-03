'use client';

import {
  buyerActionDescription,
  formatPricePerUsdc,
  formatUsdcAmount,
  orderSideLabel,
} from '@/lib/market/format';
import { marketForCurrency } from '@/lib/fiat/coverage';
import type { PostOrderSide } from '@/components/orders/post-order-side-pills';
import type { PostOrderStep } from '@/components/orders/post-order-step-nav';

type Props = {
  step: PostOrderStep;
  side: PostOrderSide;
  fiatCurrency: string;
  pricePerUsdc: string;
  minUsdc: string;
  maxUsdc: string;
  availableUsdc: string;
  payoutReady: boolean;
  fiatReady: boolean;
};

function formatFiatEstimate(currency: string, amount: number): string | null {
  if (!Number.isFinite(amount) || amount <= 0) {
    return null;
  }
  const formatted = new Intl.NumberFormat('en-US', {
    maximumFractionDigits: amount >= 1000 ? 0 : 2,
  }).format(amount);
  return `${formatted} ${currency}`;
}

function fiatAtPrice(pricePerUsdc: string, usdc: string): number | null {
  const price = Number(pricePerUsdc);
  const amount = Number(usdc);
  if (!Number.isFinite(price) || !Number.isFinite(amount) || price <= 0 || amount <= 0) {
    return null;
  }
  return price * amount;
}

export function PostOrderPreview({
  step,
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

  const listingFiat = fiatAtPrice(pricePerUsdc, availableUsdc);
  const minTradeFiat = fiatAtPrice(pricePerUsdc, minUsdc);
  const maxTradeFiat = fiatAtPrice(pricePerUsdc, maxUsdc);

  const listingFiatLabel =
    listingFiat !== null ? formatFiatEstimate(fiatCurrency, listingFiat) : null;
  const tradeFiatLabel =
    minTradeFiat !== null && maxTradeFiat !== null
      ? `${formatFiatEstimate(fiatCurrency, minTradeFiat)} – ${formatFiatEstimate(fiatCurrency, maxTradeFiat)}`
      : null;

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
          Listing summary
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
          <dt className="text-[var(--foreground-tertiary)]">Total listing</dt>
          <dd className="text-right font-medium tabular-nums text-[var(--foreground)]">
            {formatUsdcAmount(availableUsdc)} USDC
            {listingFiatLabel ? (
              <span className="mt-0.5 block text-xs font-normal text-[var(--foreground-tertiary)]">
                ≈ {listingFiatLabel}
              </span>
            ) : null}
          </dd>
        </div>
        <div className="flex justify-between gap-4">
          <dt className="text-[var(--foreground-tertiary)]">Each trade</dt>
          <dd className="text-right font-medium tabular-nums text-[var(--foreground)]">
            {formatUsdcAmount(minUsdc)} – {formatUsdcAmount(maxUsdc)} USDC
            {tradeFiatLabel ? (
              <span className="mt-0.5 block text-xs font-normal text-[var(--foreground-tertiary)]">
                ≈ {tradeFiatLabel}
              </span>
            ) : null}
          </dd>
        </div>
      </dl>

      {step < 4 ? (
        <p className="rounded-[var(--radius-ui)] border border-[var(--line)] bg-[var(--fill)] px-3 py-2 text-xs text-[var(--foreground-secondary)] text-pretty">
          {step === 1
            ? 'Amount and payout appear here as you continue.'
            : step === 2
              ? 'Add payout on the next step, then review before posting.'
              : 'Review on the next step before your listing goes live.'}
        </p>
      ) : (
        <p className="rounded-[var(--radius-ui)] border border-[color-mix(in_srgb,var(--accent)_35%,var(--line))] bg-[color-mix(in_srgb,var(--accent)_8%,var(--fill))] px-3 py-2 text-xs text-[var(--foreground-secondary)] text-pretty">
          Ready to post when you confirm below.
        </p>
      )}

      <ul className="space-y-2 border-t border-[var(--line)] pt-4 text-xs text-[var(--foreground-secondary)]">
        <li
          className={
            payoutReady ? 'text-[var(--foreground-secondary)]' : 'text-amber-700 dark:text-amber-300'
          }
        >
          {payoutReady
            ? 'USDC payout address is set for escrow release.'
            : 'Add a Stellar payout address before posting.'}
        </li>
        {side === 'sell_usdc' ? (
          <li
            className={
              fiatReady ? 'text-[var(--foreground-secondary)]' : 'text-amber-700 dark:text-amber-300'
            }
          >
            {fiatReady
              ? 'Fiat instructions are saved for this currency.'
              : 'Add fiat payment details so buyers know how to pay you.'}
          </li>
        ) : null}
      </ul>
    </aside>
  );
}
