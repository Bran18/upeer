'use client';

import { ViewTransition } from 'react';
import { HeroVisual } from '@/components/visual/hero-background';
import { GlowButton } from '@/components/ui/glow-button';
import { NavLink } from '@/components/transition/nav-link';

const PILLARS = [
  {
    title: 'Verified merchants',
    body: 'OTC liquidity from vetted desks on Stellar testnet.',
    glyph: '✓',
  },
  {
    title: 'Locked quotes',
    body: 'Reflector reference and spread, fixed before you commit.',
    glyph: '◎',
  },
  {
    title: 'Escrow on-chain',
    body: 'Trustless Work milestones for the USDC leg.',
    glyph: '⬡',
  },
] as const;

export function LandingPage() {
  return (
    <div className="overflow-hidden">
      <section className="relative apple-aurora">
        <div className="mx-auto grid max-w-[980px] gap-10 px-6 pb-20 pt-14 sm:pt-20 lg:grid-cols-[1fr_1fr] lg:items-center lg:gap-6 lg:pb-28 lg:pt-24">
          <ViewTransition enter="fade-in" exit="fade-out" default="none">
            <div className="max-w-xl">
              <p className="hero-fade-in text-caption font-medium uppercase tracking-widest">
                USDC on Stellar
              </p>
              <h1 className="hero-fade-in-delay text-large-title mt-3 text-balance">
                OTC trading,
                <span className="text-[var(--foreground-secondary)]">
                  {' '}
                  designed to feel effortless.
                </span>
              </h1>
              <p className="hero-fade-in-delay-2 text-body mt-5 max-w-md">
                UPEER connects buyers and merchants with clear quotes and
                escrow you can verify. Sign in with Pollar—then trade.
              </p>
              <div className="hero-fade-in-delay-3 mt-8 flex flex-wrap items-center gap-3">
                <GlowButton href="/market">Browse market</GlowButton>
                <GlowButton href="/app" variant="secondary">
                  Console
                </GlowButton>
              </div>
            </div>
          </ViewTransition>

          <ViewTransition enter="slide-up" default="none">
            <HeroVisual />
          </ViewTransition>
        </div>
      </section>

      <section className="bg-[var(--background-secondary)] px-6 py-20 sm:py-28">
        <div className="mx-auto max-w-[980px]">
          <h2 className="text-title-2 text-center text-balance">
            Everything you need. Nothing you don&apos;t.
          </h2>
          <p className="text-body mx-auto mt-3 max-w-lg text-center">
            Three ideas behind every trade on UPEER.
          </p>
          <div className="mt-12 grid gap-4 sm:grid-cols-3">
            {PILLARS.map((item) => (
              <ViewTransition key={item.title} enter="slide-up" default="none">
                <article className="bento-card h-full text-center sm:text-left">
                  <span
                    className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-[var(--accent-muted)] text-lg text-[var(--accent)]"
                    aria-hidden
                  >
                    {item.glyph}
                  </span>
                  <h3 className="text-headline mt-4">{item.title}</h3>
                  <p className="text-body mt-2 text-[0.9375rem]">{item.body}</p>
                </article>
              </ViewTransition>
            ))}
          </div>
        </div>
      </section>

      <section className="px-6 py-20">
        <div className="mx-auto flex max-w-[980px] flex-col items-center text-center">
          <p className="text-caption uppercase tracking-widest">How it works</p>
          <ol className="mt-8 flex flex-col gap-6 sm:flex-row sm:gap-12">
            {[
              ['Quote', 'Pick an offer and lock terms.'],
              ['Fund', 'Deploy Trustless Work escrow.'],
              ['Release', 'Milestone approval releases USDC.'],
            ].map(([step, detail], i) => (
              <li key={step} className="max-w-[200px]">
                <span className="text-headline text-[var(--accent)]">
                  {i + 1}
                </span>
                <p className="text-headline mt-1">{step}</p>
                <p className="text-body mt-1 text-[0.875rem]">{detail}</p>
              </li>
            ))}
          </ol>
          <NavLink
            href="/merchant"
            direction="forward"
            className="mt-12 text-[0.9375rem] font-medium text-[var(--accent)] hover:underline"
          >
            List liquidity as a merchant
          </NavLink>
        </div>
      </section>
    </div>
  );
}
