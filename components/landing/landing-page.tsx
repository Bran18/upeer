import { LandingHero } from '@/components/landing/landing-hero';
import { GlowButton } from '@/components/ui/glow-button';
import { NavLink } from '@/components/transition/nav-link';
import { ScrollReveal } from '@/components/ui/scroll-reveal';

const KNOW = [
  {
    n: '01',
    title: 'A quote that holds',
    body: 'Reflector sets the reference. Your spread is locked before anyone funds.',
  },
  {
    n: '02',
    title: 'Escrow you can see',
    body: 'USDC sits in Trustless Work until the milestone is approved. Not in a middleman wallet.',
  },
  {
    n: '03',
    title: 'Fiat stays off-chain',
    body: 'You settle local currency with the desk. UPEER never pretends a declaration is a payment.',
  },
] as const;

export function LandingPage() {
  return (
    <div>
      <LandingHero />

      <section
        aria-labelledby="know-heading"
        className="border-t border-[var(--line)] px-5 py-16 sm:px-8 sm:py-20"
      >
        <div className="mx-auto max-w-[1120px]">
          <ScrollReveal>
            <h2
              id="know-heading"
              className="font-mono text-[0.6875rem] uppercase tracking-[0.28em] text-[var(--foreground-tertiary)]"
            >
              All you need to know
            </h2>
          </ScrollReveal>
          <ol className="mt-10 grid gap-10 sm:grid-cols-3 sm:gap-12">
            {KNOW.map((item, index) => (
              <ScrollReveal key={item.n} delayMs={index * 70} as="li">
                <p className="font-mono text-[0.6875rem] text-[var(--accent)]">
                  {item.n}
                </p>
                <h3 className="mt-3 text-[1.25rem] font-semibold tracking-tight">
                  {item.title}
                </h3>
                <p className="mt-2 text-[0.9375rem] leading-relaxed text-[var(--foreground-secondary)] text-pretty">
                  {item.body}
                </p>
              </ScrollReveal>
            ))}
          </ol>
        </div>
      </section>

      <section className="px-5 pb-16 sm:px-8 sm:pb-20">
        <ScrollReveal>
          <div className="mx-auto flex max-w-[1120px] flex-col items-start justify-between gap-6 border-t border-[var(--line)] pt-12 sm:flex-row sm:items-center">
            <div>
              <h2 className="text-[1.75rem] font-semibold tracking-tight">
                Ready when you are.
              </h2>
              <p className="mt-1 text-[var(--foreground-secondary)]">
                Testnet. Real escrow. No theatre.
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <GlowButton href="/market">Enter the market</GlowButton>
              <NavLink
                href="/merchant"
                direction="forward"
                className="inline-flex min-h-[44px] items-center text-[0.9375rem] font-medium text-[var(--foreground-secondary)] hover:text-[var(--foreground)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent)]"
              >
                List as a merchant
              </NavLink>
            </div>
          </div>
        </ScrollReveal>
      </section>
    </div>
  );
}
