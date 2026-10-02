import { GlowButton } from '@/components/ui/glow-button';
import { NavLink } from '@/components/transition/nav-link';
import { ScrollReveal } from '@/components/ui/scroll-reveal';

export function LandingCtaSection() {
  return (
    <section aria-labelledby="cta-heading" className="pb-16 sm:pb-24">
      <div className="page-shell">
        <ScrollReveal>
          <div className="finale-cta gradient-border-card px-6 py-10 sm:px-10 sm:py-12">
            <div className="relative z-[1] flex flex-col gap-8 lg:flex-row lg:items-center lg:justify-between">
              <div className="max-w-md">
                <p className="text-caption font-medium uppercase tracking-[0.22em]">
                  Start
                </p>
                <h2 id="cta-heading" className="text-title-2 mt-3 text-balance">
                  Ready when you are
                </h2>
                <p className="text-body mt-3 text-pretty">
                  Testnet. Real escrow. No theatre.
                </p>
              </div>
              <div className="flex w-full flex-col gap-3 sm:w-auto sm:flex-row sm:flex-wrap sm:items-center">
                <GlowButton href="/market" className="w-full sm:w-auto">
                  Enter the Market
                </GlowButton>
                <NavLink
                  href="/merchant"
                  direction="forward"
                  className="btn-ghost w-full sm:w-auto"
                >
                  List as a Merchant
                </NavLink>
              </div>
            </div>
          </div>
        </ScrollReveal>
      </div>
    </section>
  );
}
