import { notFound } from 'next/navigation';
import { OrderDetailClient } from '@/components/orders/order-detail-client';
import { AppPage } from '@/components/ui/app-page';
import { DirectionalTransition } from '@/components/transition/directional-transition';
import { NavLink } from '@/components/transition/nav-link';

type Props = { params: Promise<{ orderId: string }> };

export default async function OrderPage({ params }: Props) {
  const { orderId } = await params;
  if (!orderId.includes('-')) {
    notFound();
  }

  return (
    <DirectionalTransition>
      <AppPage width="content">
        <NavLink
          href="/orders"
          direction="back"
          className="text-sm font-medium text-[var(--accent)] hover:text-[var(--accent-hover)] hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent)]"
        >
          ← Back to Orders
        </NavLink>
        <div className="mt-6">
          <OrderDetailClient orderId={orderId} />
        </div>
      </AppPage>
    </DirectionalTransition>
  );
}
