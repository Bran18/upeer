import Link from 'next/link';
import type { MarketSummary } from '@/lib/market/summary';
import { formatUsdcAmount } from '@/lib/market/format';

const FLOW = [
  {
    step: '01',
    title: 'Choose a desk',
    body: 'Compare spread, fiat rail, and verified merchant inventory.',
  },
  {
    step: '02',
    title: 'Lock the quote',
    body: 'Reflector reference plus the desk spread—fixed before escrow.',
  },
  {
    step: '03',
    title: 'Settle with escrow',
    body: 'USDC moves through Trustless Work; fiat with the desk off-chain.',
  },
] as const;

type Props = {
  summary: MarketSummary;
  className?: string;
};

export function MarketIntro({ summary, className }: Props) {
  return (
    <div className={className}>
      <div className="max-w-3xl">
        <p className="text-[0.6875rem] font-medium uppercase tracking-[0.28em] text-[var(--foreground-tertiary)]">
          OTC marketplace
        </p>
        <h2 className="mt-3 text-[clamp(2rem,6vw,3.5rem)] font-medium leading-[0.92] tracking-[-0.045em] text-balance">
          Trade USDC desk-to-desk
        </h2>
        <p className="mt-5 max-w-xl text-[1.0625rem] leading-relaxed text-[var(--foreground-secondary)] text-pretty">
          Executable quotes from verified merchants. Lock the digital leg on
          Stellar; settle fiat directly with the desk.
        </p>
      </div>

      <dl className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <div className="ui-card px-4 py-3">
          <dt className="text-xs text-[var(--foreground-tertiary)]">Live desks</dt>
          <dd className="mt-1 text-2xl font-semibold tabular-nums">
            {summary.deskCount}
          </dd>
        </div>
        <div className="ui-card px-4 py-3">
          <dt className="text-xs text-[var(--foreground-tertiary)]">Fiat rails</dt>
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
          <dt className="text-xs text-[var(--foreground-tertiary)]">Lowest spread</dt>
          <dd className="mt-1 text-2xl font-semibold tabular-nums">
            {summary.lowestSpreadBps != null
              ? `${summary.lowestSpreadBps} bps`
              : '—'}
          </dd>
        </div>
        <div className="ui-card px-4 py-3">
          <dt className="text-xs text-[var(--foreground-tertiary)]">USDC available</dt>
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
        Selling USDC?{' '}
        <Link
          href="/merchant"
          className="font-medium text-[var(--accent)] hover:text-[var(--accent-hover)]"
        >
          Open your merchant desk
        </Link>
        .
      </p>
    </div>
  );
}
