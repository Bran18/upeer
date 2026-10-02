import { OnboardingFlow } from '@/components/onboarding/onboarding-flow';
import { PollarRequired } from '@/components/pollar-required';
import { DirectionalTransition } from '@/components/transition/directional-transition';

export default function OnboardingPage() {
  return (
    <DirectionalTransition>
      <div className="mx-auto max-w-2xl px-4 py-14 sm:px-6">
        <PollarRequired
          fallback={
            <p className="text-sm text-[var(--muted)]">
              Sign in with Pollar from the header to continue onboarding.
            </p>
          }
        >
          <p className="font-mono text-xs uppercase tracking-[0.2em] text-[var(--accent)]">
            Welcome
          </p>
          <h1 className="mt-3 font-[family-name:var(--font-display)] text-3xl font-bold tracking-tight text-balance sm:text-4xl">
            How will you use UPEER?
          </h1>
          <p className="mt-4 text-pretty text-[var(--muted)]">
            One wallet, one profile—pick buyer, merchant, or both and we&apos;ll
            route you to the right tools.
          </p>
          <div className="mt-10">
            <OnboardingFlow />
          </div>
        </PollarRequired>
      </div>
    </DirectionalTransition>
  );
}
