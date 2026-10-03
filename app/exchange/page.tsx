import { ExchangeWidget } from '@/components/exchange/exchange-widget';
import { DirectionalTransition } from '@/components/transition/directional-transition';
import { AppPage } from '@/components/ui/app-page';
import { ScreenHeader } from '@/components/ui/screen-header';
import { listMarketOffers } from '@/lib/data/offers';

export default async function ExchangePage() {
  const offers = await listMarketOffers();

  return (
    <DirectionalTransition>
      <AppPage width="narrow" className="!pt-10 sm:!pt-14">
        <ScreenHeader
          title="What do you want to exchange?"
          description="Tell upeer what you have, what you want, and how much. We match liquidity and return a quote you can execute."
        />
        <ExchangeWidget offers={offers} />
      </AppPage>
    </DirectionalTransition>
  );
}
