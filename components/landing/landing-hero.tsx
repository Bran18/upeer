'use client';

import { ViewTransition } from 'react';
import { HeroVisual } from '@/components/visual/hero-background';
import { GlowButton } from '@/components/ui/glow-button';

export function LandingHero() {
  return (
    <section className="relative apple-aurora">
      <div className="mx-auto grid max-w-[1080px] items-center gap-8 px-6 pb-16 pt-12 sm:pt-16 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] lg:gap-8 lg:pb-20 lg:pt-16">
        <ViewTransition enter="fade-in" exit="fade-out" default="none">
          <div className="relative z-10 min-w-0 max-w-xl">
            <p className="hero-fade-in text-caption font-medium uppercase tracking-[0.22em]">
              USDC on Stellar
            </p>
            <h1 className="hero-fade-in-delay text-large-title mt-4 text-balance">
              OTC trading,
              <br />
              designed to feel
              <span className="text-accent-word"> effortless.</span>
            </h1>
            <p className="hero-fade-in-delay-2 text-body mt-5 max-w-md text-pretty">
              Clear quotes. Escrow you can verify. Sign in, then trade.
            </p>
            <div className="hero-fade-in-delay-3 mt-8 flex flex-wrap items-center gap-3">
              <GlowButton href="/market">Browse Market</GlowButton>
              <GlowButton href="/app" variant="secondary">
                Open Console
              </GlowButton>
            </div>
          </div>
        </ViewTransition>

        <ViewTransition enter="slide-up" default="none">
          <HeroVisual />
        </ViewTransition>
      </div>
    </section>
  );
}
