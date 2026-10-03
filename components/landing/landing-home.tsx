import { ExchangeWidget } from '@/components/exchange/exchange-widget';
import { NavLink } from '@/components/transition/nav-link';
import { listMarketOffers } from '@/lib/data/offers';

export async function LandingHome() {
  const offers = await listMarketOffers();

  return (
    <div className="relative overflow-hidden">
      <div className="apple-aurora pointer-events-none absolute inset-0" aria-hidden />
      <div className="page-shell relative grid items-start gap-10 pb-16 pt-8 sm:gap-12 sm:pb-24 sm:pt-12 lg:grid-cols-[minmax(0,1fr)_minmax(20rem,26rem)] lg:items-center lg:pt-16">
        <div className="order-2 max-w-xl lg:order-1">
          <p className="text-[0.6875rem] font-medium uppercase tracking-[0.2em] text-[var(--accent)]">
            you + peer
          </p>
          <h1 className="mt-4 text-[clamp(2.25rem,7vw,4.25rem)] font-medium leading-[0.94] tracking-[-0.045em] text-balance">
            Exchange directly.
            <br />
            Without the complexity.
          </h1>
          <p className="mt-5 max-w-md text-[1.0625rem] leading-relaxed text-[var(--foreground-secondary)] text-pretty">
            Buy and sell USDC with local currency through verified merchants.
            Transparent quotes. Protected transfers. No advertisement hunting.
          </p>
          <dl className="mt-8 grid gap-4 sm:grid-cols-3">
            <div>
              <dt className="exchange-kicker">What you have</dt>
              <dd className="mt-1 text-sm text-[var(--foreground)]">Local currency or USDC</dd>
            </div>
            <div>
              <dt className="exchange-kicker">What you want</dt>
              <dd className="mt-1 text-sm text-[var(--foreground)]">The other side</dd>
            </div>
            <div>
              <dt className="exchange-kicker">How much</dt>
              <dd className="mt-1 text-sm text-[var(--foreground)]">A quote you can take</dd>
            </div>
          </dl>
        </div>

        <div className="order-1 lg:order-2">
          <ExchangeWidget offers={offers} />
          <p className="mt-4 text-center text-xs text-[var(--foreground-tertiary)]">
            Prefer to browse?{' '}
            <NavLink href="/market" className="text-[var(--accent)] hover:underline">
              Open offers
            </NavLink>
          </p>
        </div>
      </div>
    </div>
  );
}
