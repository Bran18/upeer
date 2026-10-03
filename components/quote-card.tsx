import { formatPricePerUsdc, formatUsdcLabel, formatFiatTotal } from '@/lib/market/format';
import { formatOrderDate } from '@/lib/orders/format';

type Props = {
  fiatCurrency: string;
  usdcAmount: string;
  fiatAmount: string;
  pricePerUsdc: string;
  expiresAt: string;
};

export function QuoteCard({
  fiatCurrency,
  usdcAmount,
  fiatAmount,
  pricePerUsdc,
  expiresAt,
}: Props) {
  return (
    <div className="ui-card p-4 sm:p-5">
      <h3 className="text-sm font-medium text-[var(--foreground-tertiary)]">
        Quote
      </h3>
      <p className="mt-2 text-xl font-semibold tabular-nums break-words sm:text-2xl">
        {formatUsdcLabel(usdcAmount)} →{' '}
        {formatFiatTotal(fiatCurrency, Number(fiatAmount))}
      </p>
      <dl className="mt-4 grid gap-2 text-sm text-[var(--foreground-secondary)]">
        <div className="flex flex-col gap-0.5 sm:flex-row sm:justify-between sm:gap-4">
          <dt>Price per USDC</dt>
          <dd className="tabular-nums sm:text-right">
            {formatPricePerUsdc(fiatCurrency, pricePerUsdc)}
          </dd>
        </div>
        <div className="flex flex-col gap-0.5 sm:flex-row sm:justify-between sm:gap-4">
          <dt>Locked until</dt>
          <dd className="sm:text-right tabular-nums">
            {formatOrderDate(expiresAt)}
          </dd>
        </div>
      </dl>
    </div>
  );
}
