import Link from 'next/link';
import { UPEER_COVERAGE_BLURB } from '@/lib/fiat/coverage';
import type { MarketSummary } from '@/lib/market/summary';
import { formatPricePerUsdc, formatUsdcAmount } from '@/lib/market/format';

const FLOW = [
  {
    step: '01',
    title: 'Post an order',
    body: 'Set your price per USDC, size, and fiat rail. Your order shows on the market.',
  },
  {
    step: '02',
    title: 'Take an order',
    body: 'Pick a counterparty, enter how much USDC, and lock the fiat total at their price.',
  },
  {
    step: '03',
    title: 'Escrow on Stellar',
    body: 'USDC moves through Trustless Work. Fiat settles P2P with the other side.',
  },
] as const;

type Props = {
  summary: MarketSummary;
  className?: string;
};

export function MarketIntro({ summary, className }: Props) {
  const bestPrice =
    summary.bestSellPrice != null && summary.bestSellPriceCurrency
      ? formatPricePerUsdc(
          summary.bestSellPriceCurrency,
          summary.bestSellPrice,
        )
      : '—';

  return (
    <div className={className}>
      <div className="max-w-3xl">
        <p className="text-[0.6875rem] font-medium uppercase tracking-[0.28em] text-[var(--foreground-tertiary)]">
          P2P market
        </p>
        <h2 className="mt-3 text-[clamp(2rem,6vw,3.5rem)] font-medium leading-[0.92] tracking-[-0.045em] text-balance">
          Trade USDC peer to peer
        </h2>
        <p className="mt-5 max-w-xl text-[1.0625rem] leading-relaxed text-[var(--foreground-secondary)] text-pretty">
          Create orders at your price or take someone else&apos;s. P2P USDC↔
          local fiat in {UPEER_COVERAGE_BLURB}, with on-chain escrow on Stellar.
        </p>
      </div>

      <dl className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <div className="ui-card px-4 py-3">
          <dt className="text-xs text-[var(--foreground-tertiary)]">Open orders</dt>
          <dd className="mt-1 text-2xl font-semibold tabular-nums">
            {summary.orderCount}
          </dd>
        </div>
        <div className="ui-card px-4 py-3">
          <dt className="text-xs text-[var(--foreground-tertiary)]">Fiat pairs</dt>
          <dd className="mt-1 text-2xl font-semibold tabular-nums">
            {summary.fiatCurrencies.length || '—'}
          </dd>
          {summary.fiatCurrencies.length > 0 ? (
            <dd className="mt-0.5 truncate text-xs text-[var(--foreground-secondary)]">
              {summary.fiatCurrencies.join(' · ')}
            </dd>
          ) : null}
        </div>
        <div className="ui-card px-4 py-3">
          <dt className="text-xs text-[var(--foreground-tertiary)]">Best sell price</dt>
          <dd className="mt-1 text-2xl font-semibold tabular-nums">{bestPrice}</dd>
        </div>
        <div className="ui-card px-4 py-3">
          <dt className="text-xs text-[var(--foreground-tertiary)]">USDC on book</dt>
          <dd className="mt-1 text-2xl font-semibold tabular-nums">
            {summary.totalAvailableUsdc > 0
              ? formatUsdcAmount(String(summary.totalAvailableUsdc))
              : '—'}
          </dd>
        </div>
      </dl>

      <ol className="mt-10 grid gap-4 lg:grid-cols-3">
        {FLOW.map((item) => (
          <li key={item.step} className="ui-card p-4 sm:p-5">
            <p className="font-mono text-xs text-[var(--accent)]">{item.step}</p>
            <p className="mt-2 font-medium">{item.title}</p>
            <p className="mt-1 text-sm leading-relaxed text-[var(--foreground-secondary)] text-pretty">
              {item.body}
            </p>
          </li>
        ))}
      </ol>

      <p className="mt-8 text-sm text-[var(--foreground-tertiary)]">
        Want to list liquidity?{' '}
        <Link
          href="/merchant"
          className="font-medium text-[var(--accent)] hover:text-[var(--accent-hover)]"
        >
          Create orders
        </Link>
        .
      </p>
    </div>
  );
}
