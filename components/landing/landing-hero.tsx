'use client';

import { HeroVisual } from '@/components/visual/hero-background';
import { GlowButton } from '@/components/ui/glow-button';

export function LandingHero() {
  return (
    <section className="relative overflow-hidden">
      <div
        className="pointer-events-none absolute inset-x-0 bottom-0 top-[38%] sm:top-0 sm:h-full"
        aria-hidden
      >
        <HeroVisual fill />
      </div>
      <div
        className="page-shell relative z-10 flex flex-col justify-center pb-[min(46vh,22rem)] pt-10 sm:min-h-[calc(100svh-3.5rem)] sm:pb-16 sm:pt-16 lg:pt-20"
      >
        <div className="max-w-xl bg-transparent">
          <p className="hero-fade-in text-caption font-medium uppercase tracking-[0.18em] sm:tracking-[0.22em]">
            USDC on Stellar
          </p>
          <h1
            className="hero-fade-in-delay mt-4 text-[clamp(2.125rem,8.5vw,4.25rem)] font-semibold leading-[0.98] tracking-[-0.04em] text-balance"
          >
            OTC trading, designed to feel
            <br />
            <span className="hero-liquid">effortless.</span>
          </h1>
          <p className="hero-fade-in-delay-2 text-body mt-4 max-w-md bg-transparent text-pretty sm:mt-5">
            Clear quotes. Escrow you can verify. Sign in, then trade.
          </p>
          <div className="hero-fade-in-delay-3 mt-7 sm:mt-8">
            <GlowButton href="/market" className="w-full sm:w-auto">
              Browse the Market
            </GlowButton>
          </div>
        </div>
      </div>
    </section>
  );
}
