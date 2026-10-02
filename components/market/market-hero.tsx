'use client';

import { ScrollReveal } from '@/components/ui/scroll-reveal';

type Props = {
  offerCount: number;
};

export function MarketHero({ offerCount }: Props) {
  return (
    <section className="relative overflow-hidden border-b border-[var(--line)]">
      <div className="market-aurora pointer-events-none absolute inset-0" aria-hidden />
      <div className="page-shell relative py-12 sm:py-16 lg:py-20">
        <ScrollReveal>
          <p className="text-caption font-medium uppercase tracking-[0.18em] sm:tracking-widest">
            Liquidity
          </p>
          <h1 className="text-large-title mt-3 max-w-2xl text-balance">
            Live OTC offers
          </h1>
          <p className="text-body mt-4 max-w-xl text-pretty">
            {offerCount > 0
              ? `${offerCount} desk${offerCount === 1 ? '' : 's'} publishing USDC liquidity on testnet.`
              : 'Merchants publish USDC liquidity on testnet—check back soon.'}
          </p>
          <div className="mt-6 flex flex-col gap-3 sm:mt-8 sm:flex-row sm:flex-wrap sm:gap-4">
            <div className="gradient-border-card w-full px-5 py-3 sm:w-auto">
              <p className="text-caption">Quote engine</p>
              <p className="text-headline mt-0.5">Reflector + spread</p>
            </div>
            <div className="gradient-border-card w-full px-5 py-3 sm:w-auto">
              <p className="text-caption">Digital leg</p>
              <p className="text-headline mt-0.5">TW escrow</p>
            </div>
          </div>
        </ScrollReveal>
      </div>
    </section>
  );
}
