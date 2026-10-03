import { formatPricePerUsdc } from '@/lib/market/format';

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
    <div className="gradient-border-card p-4 sm:p-5">
      <h3 className="text-sm font-medium text-subtle">Quote</h3>
      <p className="mt-2 text-xl font-semibold tabular-nums break-words sm:text-2xl">
        {usdcAmount} USDC → {fiatAmount} {fiatCurrency}
      </p>
      <dl className="mt-4 grid gap-2 text-sm text-muted">
        <div className="flex flex-col gap-0.5 sm:flex-row sm:justify-between sm:gap-4">
          <dt>Price</dt>
          <dd className="tabular-nums sm:text-right">
            {formatPricePerUsdc(fiatCurrency, pricePerUsdc)} / USDC
          </dd>
        </div>
        <div className="flex flex-col gap-0.5 sm:flex-row sm:justify-between sm:gap-4">
          <dt>Locked until</dt>
          <dd className="sm:text-right">
            {new Date(expiresAt).toLocaleString()}
          </dd>
        </div>
      </dl>
    </div>
  );
}
