import { OnboardingFlow } from '@/components/onboarding/onboarding-flow';
import { PollarRequired } from '@/components/pollar-required';
import { DirectionalTransition } from '@/components/transition/directional-transition';

export default function OnboardingPage() {
  return (
    <DirectionalTransition>
      <div className="mx-auto max-w-[640px] px-6 py-16 sm:py-20">
        <PollarRequired
          fallback={
            <p className="text-body text-sm">
              Sign in with Pollar from the header to continue onboarding.
            </p>
          }
        >
          <p className="text-caption font-medium uppercase tracking-widest">
            Welcome
          </p>
          <h1 className="text-title-2 mt-3 text-balance">
            How will you use UPEER?
          </h1>
          <p className="text-body mt-4 text-pretty">
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
