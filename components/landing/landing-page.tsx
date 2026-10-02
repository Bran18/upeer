'use client';

import { ViewTransition } from 'react';
import { HeroBackground } from '@/components/visual/hero-background';
import { GlowButton } from '@/components/ui/glow-button';
import { NavLink } from '@/components/transition/nav-link';

const PILLARS = [
  {
    title: 'Verified liquidity',
    body: 'Trade with merchants you can trust—OTC USDC on Stellar testnet.',
  },
  {
    title: 'Executable quotes',
    body: 'Reflector references plus spread, locked before you fund escrow.',
  },
  {
    title: 'Escrow you can verify',
    body: 'Trustless Work single-release milestones for the digital leg.',
  },
] as const;

export function LandingPage() {
  return (
    <div className="relative min-h-[calc(100vh-8rem)] overflow-hidden">
      <HeroBackground />

      <div className="relative mx-auto flex max-w-6xl flex-col px-4 pb-24 pt-16 sm:px-6 lg:pt-24">
        <ViewTransition enter="slide-up" exit="fade-out" default="none">
          <div className="max-w-3xl">
            <p className="hero-fade-in font-mono text-xs uppercase tracking-[0.28em] text-[var(--accent)]">
              Stellar · USDC · OTC
            </p>
            <h1 className="hero-fade-in-delay mt-5 font-[family-name:var(--font-display)] text-5xl font-bold leading-[1.05] tracking-tight text-balance sm:text-6xl lg:text-7xl">
              Move USDC
              <span className="block bg-gradient-to-r from-[var(--accent)] via-emerald-200 to-violet-300 bg-clip-text text-transparent">
                peer to peer.
              </span>
            </h1>
            <p className="hero-fade-in-delay-2 mt-6 max-w-xl text-lg leading-relaxed text-[var(--muted)]">
              UPEER is the marketplace layer—minimal friction, maximum clarity.
              Connect with Pollar, pick a role, trade with escrow-backed
              settlement.
            </p>
            <div className="hero-fade-in-delay-3 mt-10 flex flex-wrap items-center gap-4">
              <GlowButton href="/market">Explore market</GlowButton>
              <GlowButton href="/app" variant="ghost">
                Open console
              </GlowButton>
            </div>
          </div>
        </ViewTransition>

        <section className="mt-24 grid gap-4 sm:grid-cols-3">
          {PILLARS.map((item, index) => (
            <ViewTransition key={item.title} enter="slide-up" default="none">
              <article
                className="glass-panel p-6 transition hover:border-[var(--accent)]/30"
                style={{ animationDelay: `${index * 80}ms` }}
              >
                <h2 className="font-[family-name:var(--font-display)] text-lg font-semibold">
                  {item.title}
                </h2>
                <p className="mt-2 text-sm leading-relaxed text-[var(--muted)]">
                  {item.body}
                </p>
              </article>
            </ViewTransition>
          ))}
        </section>

        <section className="mt-20 flex flex-col items-start justify-between gap-6 border-t border-[var(--line)] pt-12 sm:flex-row sm:items-center">
          <div>
            <p className="font-mono text-xs uppercase tracking-[0.2em] text-[var(--muted)]">
              Three steps
            </p>
            <ol className="mt-4 space-y-2 text-sm text-[var(--muted)]">
              <li>
                <span className="text-[var(--foreground)]">01</span> — Quote &
                reserve
              </li>
              <li>
                <span className="text-[var(--foreground)]">02</span> — Fund
                escrow
              </li>
              <li>
                <span className="text-[var(--foreground)]">03</span> — Release
                on milestone
              </li>
            </ol>
          </div>
          <NavLink
            href="/merchant"
            direction="forward"
            className="text-sm font-medium text-[var(--accent)] underline-offset-4 hover:underline"
          >
            Become a merchant →
          </NavLink>
        </section>
      </div>
    </div>
  );
}
