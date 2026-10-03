import { LandingExperience } from '@/components/landing/landing-experience';
import { listMarketOffers } from '@/lib/data/offers';
import { summarizeMarket } from '@/lib/market/summary';

export async function LandingPage() {
  const offers = await listMarketOffers();
  const marketSummary = summarizeMarket(offers);

  return <LandingExperience marketSummary={marketSummary} />;
}
