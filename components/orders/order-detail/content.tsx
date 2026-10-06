'use client';

import { OrderDetailActionsPanel } from '@/components/orders/order-detail/actions-panel';
import { useOrderDetailContext } from '@/components/orders/order-detail/context';
import { OrderProgressSteps } from '@/components/orders/order-progress-steps';
import { OrderSummary } from '@/components/orders/order-summary';
import { Button } from '@/components/ui/button';

export function OrderDetailContent() {
  const {
    isAuthenticated,
    verified,
    openLoginModal,
    loadError,
    order,
    action,
    isMaker,
    isUsdcBuyer,
    isUsdcSeller,
    escrowOnChain,
    escrowStatusError,
    showUsdcRelease,
  } = useOrderDetailContext();

  if (!isAuthenticated || !verified) {
    return (
      <div className="ui-card px-5 py-8 text-center sm:px-6">
        <p className="text-base font-medium">Sign In to Open This Order</p>
        <p className="mx-auto mt-2 max-w-md text-sm text-[var(--foreground-secondary)] text-pretty">
          Orders are private to the desk and the taker.
        </p>
        <Button type="button" className="mt-6" onClick={() => openLoginModal()}>
          Sign In
        </Button>
      </div>
    );
  }

  if (loadError && !order) {
    return (
      <p className="text-sm text-red-400" role="status" aria-live="polite">
        {loadError}
      </p>
    );
  }

  if (!order) {
    return (
      <p className="text-sm text-[var(--foreground-tertiary)]">
        Loading order…
      </p>
    );
  }

  return (
    <div>
      <h1 className="text-title-2 text-balance scroll-mt-[var(--site-header-height)]">
        {action}
      </h1>
      <p className="mt-3 max-w-xl text-[0.9375rem] text-[var(--foreground-secondary)] text-pretty">
        Review the locked quote, then complete the next step for your side.
      </p>

      <div className="mt-8 grid gap-4 lg:mt-10 lg:grid-cols-[minmax(0,1.05fr)_minmax(20rem,0.95fr)] lg:items-start">
        <OrderSummary
          order={order}
          isMaker={isMaker}
          isUsdcBuyer={isUsdcBuyer}
          isUsdcSeller={isUsdcSeller}
          showUsdcRelease={showUsdcRelease}
          escrowOnChain={escrowOnChain}
          escrowStatusError={escrowStatusError}
        />

        <div className="flex flex-col gap-4 lg:col-start-2 lg:row-start-1">
          <OrderProgressSteps order={order} className="order-2 lg:order-1" />
          <div className="order-1 lg:order-2">
            <OrderDetailActionsPanel />
          </div>
        </div>
      </div>
    </div>
  );
}
