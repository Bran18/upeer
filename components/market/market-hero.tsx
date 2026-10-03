'use client';

type Props = {
  offerCount: number;
};

export function MarketHero({ offerCount }: Props) {
  return (
    <section className="relative overflow-hidden border-b border-[var(--line)]">
      <div className="page-shell relative py-16 sm:py-24 lg:py-28">
        <p className="text-[0.6875rem] font-medium uppercase tracking-[0.28em] text-[var(--foreground-tertiary)]">
          Liquidity
        </p>
        <h1 className="mt-4 max-w-3xl text-[clamp(2.75rem,8vw,6rem)] font-medium leading-[0.9] tracking-[-0.05em] text-balance">
          Live OTC
          <br />
          offers
        </h1>
        <p className="mt-6 max-w-md text-[1.0625rem] leading-relaxed text-[var(--foreground-secondary)] text-pretty">
          {offerCount > 0
            ? `${offerCount} desk${offerCount === 1 ? '' : 's'} publishing USDC liquidity on testnet.`
            : 'Merchants publish USDC liquidity on testnet—check back soon.'}
        </p>
      </div>
    </section>
  );
}
