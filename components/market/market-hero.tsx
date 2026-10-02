'use client';

import { ScrollReveal } from '@/components/ui/scroll-reveal';
import { GlowButton } from '@/components/ui/glow-button';

type Props = {
  offerCount: number;
};

export function MarketHero({ offerCount }: Props) {
  return (
    <section className="relative overflow-hidden border-b border-[var(--line)]">
      <div className="market-aurora pointer-events-none absolute inset-0" aria-hidden />
      <div className="relative mx-auto max-w-[980px] px-6 py-16 sm:py-20">
        <ScrollReveal>
          <p className="text-caption font-medium uppercase tracking-widest">
            Liquidity
          </p>
          <h1 className="text-large-title mt-3 max-w-2xl text-balance">
            Live OTC offers
          </h1>
          <p className="text-body mt-4 max-w-xl">
            {offerCount > 0
              ? `${offerCount} desk${offerCount === 1 ? '' : 's'} publishing USDC liquidity on testnet.`
              : 'Merchants publish USDC liquidity on testnet—check back soon.'}
          </p>
          <div className="mt-8 flex flex-wrap gap-6">
            <div className="gradient-border-pill px-5 py-3">
              <p className="text-caption">Quote engine</p>
              <p className="text-headline mt-0.5">Reflector + spread</p>
            </div>
            <div className="gradient-border-pill px-5 py-3">
              <p className="text-caption">Digital leg</p>
              <p className="text-headline mt-0.5">TW escrow</p>
            </div>
          </div>
          <GlowButton href="/app" variant="secondary" className="mt-8">
            Open Console
          </GlowButton>
        </ScrollReveal>
      </div>
    </section>
  );
}
