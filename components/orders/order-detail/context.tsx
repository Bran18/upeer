'use client';

import { createContext, useContext, type ReactNode } from 'react';
import type { OrderDetail } from '@/lib/db/orders';
import { useOrderDetail } from '@/components/orders/order-detail/use-order-detail';

export type OrderDetailContextValue = ReturnType<typeof useOrderDetail>;

const OrderDetailContext = createContext<OrderDetailContextValue | null>(null);

type ProviderProps = {
  orderId: string;
  initial?: OrderDetail | null;
  children: ReactNode;
};

export function OrderDetailProvider({
  orderId,
  initial,
  children,
}: ProviderProps) {
  const value = useOrderDetail({ orderId, initial });
  return (
    <OrderDetailContext.Provider value={value}>
      {children}
    </OrderDetailContext.Provider>
  );
}

export function useOrderDetailContext(): OrderDetailContextValue {
  const value = useContext(OrderDetailContext);
  if (!value) {
    throw new Error(
      'useOrderDetailContext must be used within OrderDetailProvider',
    );
  }
  return value;
}
