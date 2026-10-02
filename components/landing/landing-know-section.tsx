import { ScrollReveal } from '@/components/ui/scroll-reveal';
import { IconLayers, IconLock, IconShield } from '@/components/ui/icons';
import type { ReactNode } from 'react';

const KNOW = [
  {
    n: '01',
    title: 'A quote that holds',
    body: 'Reflector sets the reference. Your spread is locked before anyone funds.',
    Icon: IconLock,
  },
  {
    n: '02',
    title: 'Escrow you can see',
    body: 'USDC sits in Trustless Work until the milestone is approved—not in a middleman wallet.',
    Icon: IconLayers,
  },
  {
    n: '03',
    title: 'Fiat stays off-chain',
    body: 'You settle local currency with the desk. A declaration is never treated as payment.',
    Icon: IconShield,
  },
] as const;

function KnowCard({
  n,
  title,
  body,
  icon,
}: {
  n: string;
  title: string;
  body: string;
  icon: ReactNode;
}) {
  return (
    <article className="know-card gradient-border-card group relative flex h-full flex-col p-6 sm:p-7">
      <span
        className="pointer-events-none absolute right-4 top-3 font-mono text-[3.5rem] font-semibold leading-none tracking-tighter text-[var(--foreground)] opacity-[0.05] select-none sm:text-[4rem]"
        aria-hidden
      >
        {n}
      </span>
      <div className="relative flex items-center gap-3">
        <span
          className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[var(--accent-muted)] text-[var(--accent)] transition-[transform,background-color] duration-300 group-hover:scale-[1.03] group-hover:bg-[var(--accent)]/20"
        >
          {icon}
        </span>
        <span className="font-mono text-[0.6875rem] tracking-[0.2em] text-[var(--accent)]">
          {n}
        </span>
      </div>
      <h3 className="relative mt-5 text-[1.125rem] font-semibold tracking-tight text-balance sm:text-[1.25rem]">
        {title}
      </h3>
      <p className="relative mt-2 flex-1 text-[0.9375rem] leading-relaxed text-[var(--foreground-secondary)] text-pretty">
        {body}
      </p>
      <div
        className="relative mt-6 h-px w-full bg-gradient-to-r from-[var(--accent)]/50 via-[var(--line)] to-transparent opacity-80"
        aria-hidden
      />
    </article>
  );
}

export function LandingKnowSection() {
  return (
    <section
      aria-labelledby="know-heading"
      className="know-section relative border-y border-[var(--line)] py-16 sm:py-24"
    >
      <div className="know-section-glow pointer-events-none absolute inset-0" aria-hidden />
      <div className="page-shell relative">
        <ScrollReveal>
          <header className="mx-auto max-w-2xl text-center lg:mx-0 lg:max-w-xl lg:text-left">
            <p className="text-caption font-medium uppercase tracking-[0.22em]">
              How UPEER works
            </p>
            <h2 id="know-heading" className="text-title-2 mt-3 text-balance">
              All you need to know
            </h2>
            <p className="text-body mt-4 text-pretty">
              Three ideas behind every OTC leg—quote, escrow, and honest fiat
              settlement.
            </p>
          </header>
        </ScrollReveal>

        <ol className="know-steps mt-12 grid gap-4 sm:mt-14 sm:grid-cols-2 sm:gap-5 lg:grid-cols-3">
          {KNOW.map((item, index) => (
            <ScrollReveal
              key={item.n}
              delayMs={index * 80}
              as="li"
              className={index === 2 ? 'sm:col-span-2 lg:col-span-1' : ''}
            >
              <KnowCard
                n={item.n}
                title={item.title}
                body={item.body}
                icon={<item.Icon className="h-5 w-5" />}
              />
            </ScrollReveal>
          ))}
        </ol>
      </div>
    </section>
  );
}
