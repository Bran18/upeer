import { LandingHero } from '@/components/landing/landing-hero';
import { LandingKnowSection } from '@/components/landing/landing-know-section';
import { LandingCtaSection } from '@/components/landing/landing-cta-section';

export function LandingPage() {
  return (
    <div>
      <LandingHero />
      <LandingKnowSection />
      <LandingCtaSection />
    </div>
  );
}
