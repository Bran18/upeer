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
          title="Get a quote"
          description="Choose what you want. We match a peer and lock the price."
        />
        <ExchangeWidget offers={offers} />
      </AppPage>
    </DirectionalTransition>
  );
}
