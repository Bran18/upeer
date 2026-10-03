'use client';

import Link from 'next/link';
import { usePollar } from '@pollar/react';
import { useCallback, useEffect, useState } from 'react';
import type { OrderDetail } from '@/lib/db/orders';
import { PollarRequired } from '@/components/pollar-required';
import {
  exchangePollarSessionFromClient,
  readStoredSession,
  upeerAuthedFetch,
} from '@/lib/upeer-api';

export function OrdersListClient() {
  return (
    <PollarRequired>
      <OrdersListInner />
    </PollarRequired>
  );
}

function OrdersListInner() {
  const { getClient, isAuthenticated, verified } = usePollar();
  const [role, setRole] = useState<'all' | 'incoming' | 'outgoing'>('all');
  const [orders, setOrders] = useState<OrderDetail[]>([]);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    let session = readStoredSession();
    if (!session) {
      const auth = getClient().getAuthState();
      if (auth.step === 'authenticated') {
        session = await exchangePollarSessionFromClient(getClient());
      }
    }
    if (!session) {
      return;
    }
    const res = await upeerAuthedFetch(`/api/orders?role=${role}`);
    const data = await res.json();
    if (!res.ok) {
      setError(data.error ?? 'Failed to load');
      return;
    }
    setError(null);
    setOrders(data.orders ?? []);
  }, [role, getClient]);

  useEffect(() => {
    if (isAuthenticated && verified) {
      void load();
    }
  }, [isAuthenticated, verified, load]);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap gap-2">
        {(['all', 'incoming', 'outgoing'] as const).map((r) => (
          <button
            key={r}
            type="button"
            className={`nav-pill px-3 ${role === r ? 'nav-pill--active' : ''}`}
            onClick={() => setRole(r)}
          >
            {r === 'all' ? 'All' : r === 'incoming' ? 'Incoming' : 'Outgoing'}
          </button>
        ))}
      </div>
      {error ? <p className="text-sm text-red-600">{error}</p> : null}
      <ul className="space-y-3">
        {orders.length === 0 ? (
          <li className="ui-card px-4 py-8 text-center text-sm text-muted">
            No trades yet.{' '}
            <Link href="/market" className="text-[var(--accent)]">
              Browse market
            </Link>
          </li>
        ) : (
          orders.map((o) => (
            <li key={o.id}>
              <Link
                href={`/orders/${o.id}`}
                className="ui-card block px-4 py-3 hover:border-[var(--accent)]"
              >
                <p className="font-medium">
                  {o.quote.usdc_amount} USDC → {o.quote.fiat_amount}{' '}
                  {o.quote.fiat_currency}
                </p>
                <p className="mt-1 text-xs text-muted">
                  {o.status.replace(/_/g, ' ')} ·{' '}
                  {o.offer.maker_display_name ?? 'Maker'}
                </p>
              </Link>
            </li>
          ))
        )}
      </ul>
    </div>
  );
}
