import { OrdersListClient } from '@/components/orders/orders-list-client';
import { AppPage } from '@/components/ui/app-page';
import { DirectionalTransition } from '@/components/transition/directional-transition';

export default function OrdersPage() {
  return (
    <DirectionalTransition>
      <AppPage width="content">
        <header className="mb-8">
          <h1 className="text-2xl font-medium tracking-tight">Activity</h1>
          <p className="mt-2 text-sm text-[var(--foreground-secondary)]">
            Current and previous exchanges.
          </p>
        </header>
        <OrdersListClient />
      </AppPage>
    </DirectionalTransition>
  );
}
