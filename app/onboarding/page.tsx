import { OnboardingFlow } from '@/components/onboarding/onboarding-flow';
import { PollarRequired } from '@/components/pollar-required';
import { DirectionalTransition } from '@/components/transition/directional-transition';
import { AppPage } from '@/components/ui/app-page';
import { ScreenHeader } from '@/components/ui/screen-header';

export default function OnboardingPage() {
  return (
    <DirectionalTransition>
      <AppPage width="narrow" className="!pt-10 sm:!pt-14">
        <PollarRequired
          fallback={
            <div className="surface-card p-6">
              <p className="text-headline text-sm">Wallet not configured</p>
              <p className="text-body mt-2 text-sm text-pretty">
                Set{' '}
                <code className="font-mono text-xs" translate="no">
                  NEXT_PUBLIC_POLLAR_PUBLISHABLE_KEY
                </code>{' '}
                to enable Pollar sign-in, then reload this page.
              </p>
            </div>
          }
        >
          <ScreenHeader
            titleId="onboarding-page-title"
            title="Set up your account"
            description="Two quick steps — pick how you trade, add how you want to appear, then head to the exchange."
          />
          <section aria-labelledby="onboarding-page-title">
            <OnboardingFlow />
          </section>
        </PollarRequired>
      </AppPage>
    </DirectionalTransition>
  );
}
