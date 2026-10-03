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
          <PageHeader
            titleId="onboarding-page-title"
            eyebrow="Setup"
            title="How will you use upeer?"
            description="Buy, sell, or both. Then start an exchange — upeer handles matching, quotes, and protection."
          />
          <section aria-labelledby="onboarding-page-title">
            <OnboardingFlow />
          </section>
        </PollarRequired>
      </AppPage>
    </DirectionalTransition>
  );
}
