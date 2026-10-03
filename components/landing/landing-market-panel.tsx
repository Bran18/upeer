import { MarketIntro } from '@/components/market/market-intro';
import { NavLink } from '@/components/transition/nav-link';
import type { MarketSummary } from '@/lib/market/summary';

type Props = {
  summary: MarketSummary;
};

export function LandingMarketPanel({ summary }: Props) {
  return (
    <div className="landing-market-panel">
      <MarketIntro summary={summary} />
      <NavLink href="/market" className="xp-cta xp-cta--overlay mt-8">
        View open orders
      </NavLink>
    </div>
  );
}
