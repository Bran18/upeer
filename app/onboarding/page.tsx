import { OnboardingFlow } from '@/components/onboarding/onboarding-flow';
import { PollarRequired } from '@/components/pollar-required';

export default function OnboardingPage() {
  return (
    <div className="mx-auto max-w-2xl px-4 py-12 sm:px-6">
      <PollarRequired
        fallback={
          <p className="text-sm text-zinc-600 dark:text-zinc-400">
            Sign in with Pollar from the header to continue onboarding.
          </p>
        }
      >
        <p className="text-sm font-medium text-emerald-700 dark:text-emerald-400">
          Welcome to UPEER
        </p>
        <h1 className="mt-2 text-balance text-3xl font-semibold tracking-tight">
          Choose your role on the marketplace
        </h1>
        <p className="mt-3 text-pretty text-zinc-600 dark:text-zinc-400">
          Your Stellar wallet is connected. Tell us how you plan to trade so we
          can route you to the right tools—buyers, merchants, or both.
        </p>
        <div className="mt-10">
          <OnboardingFlow />
        </div>
      </PollarRequired>
    </div>
  );
}
