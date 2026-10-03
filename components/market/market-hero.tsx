import type { MarketSummary } from '@/lib/market/summary';
import { MarketIntro } from '@/components/market/market-intro';

type Props = {
  summary: MarketSummary;
};

/** Full-width hero shell (e.g. standalone pages). Landing uses {@link MarketIntro} in scroll. */
export function MarketHero({ summary }: Props) {
  return (
    <section className="relative overflow-hidden border-b border-[var(--line)]">
      <div className="market-aurora pointer-events-none absolute inset-0" aria-hidden />
      <div className="page-shell relative py-12 sm:py-16 lg:py-20">
        <MarketIntro summary={summary} />
      </div>
    </section>
  );
}
