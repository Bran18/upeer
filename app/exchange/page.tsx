import { ExchangeWidget } from '@/components/exchange/exchange-widget';
import { DirectionalTransition } from '@/components/transition/directional-transition';
import { AppPage } from '@/components/ui/app-page';
import { listMarketOffers } from '@/lib/data/offers';

export default async function ExchangePage() {
  const offers = await listMarketOffers();

  return (
    <DirectionalTransition>
      <AppPage width="narrow" className="!pt-10 sm:!pt-14">
        <header className="mb-8 max-w-md">
          <h1 className="text-[clamp(1.85rem,5vw,2.5rem)] font-medium tracking-[-0.04em] text-balance">
            What do you want to exchange?
          </h1>
          <p className="mt-3 text-sm leading-relaxed text-[var(--foreground-secondary)] text-pretty">
            Tell upeer what you have, what you want, and how much. We match
            liquidity and return a quote you can execute.
          </p>
        </header>
        <ExchangeWidget offers={offers} />
      </AppPage>
    </DirectionalTransition>
  );
}
