import { OnboardingFlow } from '@/components/onboarding/onboarding-flow';
import { PollarRequired } from '@/components/pollar-required';
import { DirectionalTransition } from '@/components/transition/directional-transition';
import { AppPage } from '@/components/ui/app-page';
import { PageHeader } from '@/components/ui/page-header';

export default function OnboardingPage() {
  return (
    <DirectionalTransition>
      <AppPage width="narrow">
        <PollarRequired
          fallback={
            <p className="text-body text-sm">
              Sign in with Pollar from the header to continue onboarding.
            </p>
          }
        >
          <PageHeader
            eyebrow="Welcome"
            title="How Will You Use UPEER?"
            description="One wallet, one profile—pick buyer, merchant, or both and we'll route you to the right tools."
          />
          <div className="mt-10">
            <OnboardingFlow />
          </div>
        </PollarRequired>
      </AppPage>
    </DirectionalTransition>
  );
}
