'use client';

import type { OrderDetail } from '@/lib/db/orders';
import { OrderDetailContent } from '@/components/orders/order-detail/content';
import { OrderDetailProvider } from '@/components/orders/order-detail/context';
import { PollarRequired } from '@/components/pollar-required';

type Props = {
  orderId: string;
  initial?: OrderDetail | null;
};

export function OrderDetailClient({ orderId, initial }: Props) {
  return (
    <PollarRequired
      fallback={
        <div className="ui-card px-5 py-5 sm:px-6 sm:py-6">
          <p className="text-sm text-[var(--foreground-secondary)] text-pretty">
            Set{' '}
            <code className="font-mono text-xs" translate="no">
              NEXT_PUBLIC_POLLAR_PUBLISHABLE_KEY
            </code>{' '}
            to open this order.
          </p>
        </div>
      }
    >
      <OrderDetailProvider orderId={orderId} initial={initial}>
        <OrderDetailContent />
      </OrderDetailProvider>
    </PollarRequired>
  );
}
