import { MarketHeroScene } from '@/components/visual/market-hero-scene';
import { GlowButton } from '@/components/ui/glow-button';

export function LandingHome() {
  return (
    <div className="market-hero">
      <MarketHeroScene />
      <div className="market-hero-veil" aria-hidden />
      <div className="page-shell market-hero-content">
        <div className="market-hero-copy">
          <p className="text-[0.6875rem] font-medium uppercase tracking-[0.2em] text-[var(--accent)]">
            you + peer
          </p>
          <h1 className="mt-4 text-[clamp(2.25rem,7vw,4.25rem)] font-medium leading-[0.94] tracking-[-0.045em] text-balance">
          Exchange with people.
          </h1>
          <p className="mt-5 max-w-md text-[1.0625rem] leading-relaxed text-[var(--foreground-secondary)] text-pretty">
            Local currency for USDC, or the other way. You match a peer, take a
            quote, and settle with protection.
          </p>
          <dl className="mt-8 grid gap-4 sm:grid-cols-3">
            <div>
              <dt className="exchange-kicker">Peers</dt>
              <dd className="mt-1 text-sm text-[var(--foreground)]">Around the market</dd>
            </div>
            <div>
              <dt className="exchange-kicker">Match</dt>
              <dd className="mt-1 text-sm text-[var(--foreground)]">Through the center</dd>
            </div>
            <div>
              <dt className="exchange-kicker">Quote</dt>
              <dd className="mt-1 text-sm text-[var(--foreground)]">Yours to take</dd>
            </div>
          </dl>
          <div className="mt-8">
            <GlowButton href="/market">Browse Market</GlowButton>
          </div>
        </div>
      </div>
    </div>
  );
}
