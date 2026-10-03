'use client';

import { startTransition, useCallback, useEffect, useMemo, useState } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { ViewTransition } from 'react';
import { usePollar } from '@pollar/react';
import type { OrderDetail } from '@/lib/db/orders';
import {
  DEFAULT_ORDER_ROLE,
  orderRoleToSearchParams,
  parseOrderRole,
  type OrderRoleFilter,
} from '@/lib/orders/filters';
import { isActiveOrderStatus } from '@/lib/orders/format';
import { OrdersEmpty } from '@/components/orders/orders-empty';
import { OrdersToolbar } from '@/components/orders/orders-toolbar';
import { OrderRow } from '@/components/orders/order-row';
import { PollarRequired } from '@/components/pollar-required';
import {
  exchangePollarSessionFromClient,
  readStoredSession,
  upeerAuthedFetch,
} from '@/lib/upeer-api';

type Props = {
  initialRole?: OrderRoleFilter;
};

export function OrdersListClient({ initialRole }: Props) {
  return (
    <PollarRequired
      fallback={
        <OrdersEmpty signedIn={false} filtered={false} />
      }
    >
      <OrdersListInner initialRole={initialRole} />
    </PollarRequired>
  );
}

function OrdersListInner({ initialRole }: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { getClient, isAuthenticated, verified, openLoginModal } = usePollar();

  const role = useMemo(() => {
    if (searchParams.toString()) {
      return parseOrderRole(Object.fromEntries(searchParams.entries()));
    }
    return initialRole ?? DEFAULT_ORDER_ROLE;
  }, [searchParams, initialRole]);

  const [orders, setOrders] = useState<OrderDetail[]>([]);
  const [profileId, setProfileId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    let session = readStoredSession();
    if (!session) {
      const auth = getClient().getAuthState();
      if (auth.step === 'authenticated') {
        session = await exchangePollarSessionFromClient(getClient());
      }
    }
    if (!session) {
      setLoading(false);
      return;
    }

    const [ordersRes, meRes] = await Promise.all([
      upeerAuthedFetch(`/api/orders?role=${role}`),
      upeerAuthedFetch('/api/me'),
    ]);
    const [ordersData, meData] = await Promise.all([
      ordersRes.json(),
      meRes.json(),
    ]);

    if (!ordersRes.ok) {
      setError(
        ordersData.error ?? 'Could not load orders. Refresh and try again.',
      );
      setLoading(false);
      return;
    }

    setError(null);
    setOrders(ordersData.orders ?? []);
    if (meRes.ok) {
      setProfileId(meData.profile?.id ?? null);
    }
    setLoading(false);
  }, [role, getClient]);

  useEffect(() => {
    if (!isAuthenticated || !verified) {
      setLoading(false);
      return;
    }
    setLoading(true);
    void load();
  }, [isAuthenticated, verified, load]);

  const setRole = useCallback(
    (next: OrderRoleFilter) => {
      const query = orderRoleToSearchParams(next);
      startTransition(() => {
        router.replace(query ? `${pathname}?${query}` : pathname, {
          scroll: false,
        });
      });
    },
    [pathname, router],
  );

  const signedIn = isAuthenticated && verified;
  const activeCount = orders.filter((order) =>
    isActiveOrderStatus(order.status),
  ).length;

  if (!signedIn && !loading) {
    return (
      <OrdersEmpty
        signedIn={false}
        filtered={false}
        onSignIn={() => openLoginModal()}
      />
    );
  }

  return (
    <div className="space-y-6">
      <OrdersToolbar
        role={role}
        resultCount={orders.length}
        activeCount={activeCount}
        onChange={setRole}
      />

      {error ? (
        <p className="text-sm text-red-400" role="status" aria-live="polite">
          {error}
        </p>
      ) : null}

      {loading ? (
        <p className="text-sm text-[var(--foreground-tertiary)]">
          Loading orders…
        </p>
      ) : orders.length === 0 ? (
        <OrdersEmpty
          signedIn
          filtered={role !== 'all'}
          onResetFilters={() => setRole('all')}
        />
      ) : (
        <ul className="grid list-none gap-3">
          {orders.map((order) => (
            <li key={order.id} className="offer-list-item">
              <ViewTransition>
                <OrderRow
                  order={order}
                  isMaker={Boolean(
                    profileId && order.maker_profile_id === profileId,
                  )}
                />
              </ViewTransition>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
