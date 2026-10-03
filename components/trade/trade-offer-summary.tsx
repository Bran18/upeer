import { ViewTransition } from 'react';
import type { MarketOffer } from '@/lib/data/offers';
import { formatFiatBadge } from '@/lib/fiat/coverage';
import { Avatar } from '@/components/ui/avatar';
import {
  buyerActionDescription,
  buyerActionLabel,
  formatPricePerUsdc,
  formatUsdcAmount,
  formatUsdcLabel,
} from '@/lib/market/format';
import { offerFillBounds } from '@/lib/market/take';

type Props = {
  offer: MarketOffer;
};

export function TradeOfferSummary({ offer }: Props) {
  const action = buyerActionLabel(offer.side);
  const { min, max } = offerFillBounds(offer);
  const youPay =
    offer.side === 'sell_usdc'
      ? 'You send local currency. USDC releases from escrow after the merchant confirms.'
      : 'You send USDC into escrow. Fiat settles with this merchant.';

  const facts = [
    {
      label: 'Price per USDC',
      value: formatPricePerUsdc(offer.fiatCurrency, offer.pricePerUsdc),
    },
    {
      label: 'Available',
      value: formatUsdcLabel(offer.availableUsdc),
    },
    {
      label: 'Fill range',
      value: `${formatUsdcAmount(String(min))}–${formatUsdcAmount(String(max))}\u00a0USDC`,
    },
    {
      label: 'Market',
      value: formatFiatBadge(offer.fiatCurrency),
    },
  ];

  return (
    <aside className="ui-card flex flex-col px-5 py-5 sm:px-6 sm:py-6">
      <div className="flex items-start gap-3">
        <Avatar
          label={offer.merchantName}
          size="lg"
          className="ring-2 ring-[var(--line)] ring-offset-2 ring-offset-[var(--surface-elevated)]"
        />
        <div className="min-w-0 flex-1">
          <p className="text-[0.625rem] font-medium uppercase tracking-[0.14em] text-[var(--foreground-tertiary)]">
            {action}
          </p>
          <ViewTransition
            name={`merchant-${offer.id}`}
            share="morph"
            default="none"
          >
            <p className="mt-1 truncate text-lg font-semibold tracking-tight">
              {offer.merchantName}
            </p>
          </ViewTransition>
          <p className="mt-1 text-sm text-[var(--foreground-secondary)] text-pretty">
            {buyerActionDescription(offer.side)}
          </p>
        </div>
      </div>

      <dl className="mt-6 grid gap-3 sm:grid-cols-2">
        {facts.map((fact) => (
          <div
            key={fact.label}
            className="min-w-0 rounded-[var(--radius-ui)] border border-[var(--line)] bg-[var(--fill)] px-3 py-3"
          >
            <dt className="text-xs text-[var(--foreground-tertiary)]">
              {fact.label}
            </dt>
            <dd className="mt-1 truncate text-sm font-medium tabular-nums">
              {fact.value}
            </dd>
          </div>
        ))}
      </dl>

      <ol className="mt-6 space-y-3 border-t border-[var(--line)] pt-5">
        <li className="text-sm leading-relaxed text-[var(--foreground-secondary)] text-pretty">
          <span className="font-medium text-[var(--foreground)]">1. Size. </span>
          Enter how much USDC you want to take within the fill range.
        </li>
        <li className="text-sm leading-relaxed text-[var(--foreground-secondary)] text-pretty">
          <span className="font-medium text-[var(--foreground)]">2. Lock. </span>
          {youPay}
        </li>
        <li className="text-sm leading-relaxed text-[var(--foreground-secondary)] text-pretty">
          <span className="font-medium text-[var(--foreground)]">3. Settle. </span>
          The merchant accepts, then USDC stays protected until the local
          transfer is confirmed.
        </li>
      </ol>
    </aside>
  );
}
