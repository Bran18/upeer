import { UpeerMark } from '@/components/brand/upeer-mark';
import { LandingHeroActions } from '@/components/landing/landing-hero-actions';
import { LandingHeroSteps } from '@/components/landing/landing-hero-steps';
import { MarketHeroScene } from '@/components/visual/market-hero-scene';

export function LandingHome() {
  return (
    <div className="market-hero">
      <MarketHeroScene />
      <div className="market-hero-veil" aria-hidden />
      <div className="page-shell market-hero-content">
        <div className="market-hero-copy">
          <header className="market-hero-head">
            <p className="market-hero-eyebrow">
              <UpeerMark className="h-4 w-4" />
              <span>you + peer</span>
              <span className="market-hero-eyebrow-sep" aria-hidden />
              <span className="market-hero-eyebrow-muted">P2P on Stellar</span>
            </p>
            <h1 className="market-hero-title">
              <span className="market-hero-title-line">Exchange with</span>
              <span className="market-hero-title-accent">people.</span>
            </h1>
          </header>
          <p className="market-hero-lead">
            Buy or sell USDC with local currency. Escrow stays on Stellar; fiat
            moves directly between you and your counterparty.
          </p>
          <LandingHeroSteps />
          <LandingHeroActions />
        </div>
      </div>
    </div>
  );
}
