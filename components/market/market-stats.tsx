import type { MarketSummary } from '@/lib/market/summary';
import { formatPricePerUsdc, formatUsdcLabel } from '@/lib/market/format';

type Props = {
  summary: MarketSummary;
};

export function MarketStats({ summary }: Props) {
  const bestPrice =
    summary.bestSellPrice != null && summary.bestSellPriceCurrency
      ? formatPricePerUsdc(
          summary.bestSellPriceCurrency,
          summary.bestSellPrice,
        )
      : '—';

  const items = [
    {
      label: 'Open offers',
      value: String(summary.orderCount),
    },
    {
      label: 'Buy USDC desks',
      value: String(summary.sellOrders),
    },
    {
      label: 'Sell USDC desks',
      value: String(summary.buyOrders),
    },
    {
      label: 'Best buy price',
      value: bestPrice,
    },
    {
      label: 'USDC on book',
      value:
        summary.totalAvailableUsdc > 0
          ? formatUsdcLabel(summary.totalAvailableUsdc)
          : '—',
    },
  ];

  if (summary.orderCount === 0) {
    return null;
  }

  return (
    <dl className="mb-8 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
      {items.map((item) => (
        <div
          key={item.label}
          className="ui-card min-w-0 px-4 py-3"
        >
          <dt className="truncate text-xs text-[var(--foreground-tertiary)]">
            {item.label}
          </dt>
          <dd className="mt-1 truncate text-lg font-semibold tabular-nums tracking-tight">
            {item.value}
          </dd>
        </div>
      ))}
    </dl>
  );
}
