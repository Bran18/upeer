type Props = {
  fiatCurrency: string;
  usdcAmount: string;
  fiatAmount: string;
  referencePrice: string;
  spreadBps: number;
  expiresAt: string;
};

export function QuoteCard({
  fiatCurrency,
  usdcAmount,
  fiatAmount,
  referencePrice,
  spreadBps,
  expiresAt,
}: Props) {
  return (
    <div className="rounded-xl border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
      <h3 className="text-sm font-medium text-zinc-500">Executable quote</h3>
      <p className="mt-2 text-2xl font-semibold tabular-nums">
        {usdcAmount} USDC → {fiatAmount} {fiatCurrency}
      </p>
      <dl className="mt-4 grid gap-2 text-sm text-zinc-600 dark:text-zinc-400">
        <div className="flex justify-between">
          <dt>Reflector reference</dt>
          <dd className="font-mono">{referencePrice}</dd>
        </div>
        <div className="flex justify-between">
          <dt>Merchant spread</dt>
          <dd>{spreadBps} bps</dd>
        </div>
        <div className="flex justify-between">
          <dt>Expires</dt>
          <dd>{new Date(expiresAt).toLocaleString()}</dd>
        </div>
      </dl>
    </div>
  );
}
