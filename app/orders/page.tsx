import Link from 'next/link';
import { OrdersListClient } from '@/components/orders/orders-list-client';
import { AppPage } from '@/components/ui/app-page';
import { DirectionalTransition } from '@/components/transition/directional-transition';
import { parseOrderRole } from '@/lib/orders/filters';

type PageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function OrdersPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const initialRole = parseOrderRole(params);

  return (
    <DirectionalTransition>
      <AppPage width="wide" className="!pt-8 sm:!pt-10">
        <header className="mb-8 flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
          <div className="max-w-2xl min-w-0">
            <p className="text-[0.6875rem] font-medium uppercase tracking-[0.28em] text-[var(--foreground-tertiary)]">
              Activity
            </p>
            <h1 className="mt-2 text-[clamp(1.75rem,4vw,2.5rem)] font-medium tracking-[-0.03em] text-balance">
              Your Orders
            </h1>
            <p className="mt-3 text-[0.9375rem] leading-relaxed text-[var(--foreground-secondary)] text-pretty">
              Track takes, escrow, and fiat confirmation. Start from the{' '}
              <Link
                href="/market"
                className="font-medium text-[var(--accent)] hover:text-[var(--accent-hover)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent)]"
              >
                market
              </Link>{' '}
              or post liquidity from your desk.
            </p>
          </div>
          <Link
            href="/orders/new"
            className="btn-primary shrink-0 self-start sm:self-auto"
          >
            Post Order
          </Link>
        </header>
        <OrdersListClient initialRole={initialRole} />
      </AppPage>
    </DirectionalTransition>
  );
}
