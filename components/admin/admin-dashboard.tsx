'use client';

import { useEffect, useState } from 'react';
import { PollarRequired } from '@/components/pollar-required';
import { useUpeerSession } from '@/components/session/upeer-session-provider';
import { upeerAuthedFetch } from '@/lib/upeer-api';

type PendingMerchant = {
  id: string;
  display_name: string;
  status: string;
  created_at: string;
};

type OrderRow = {
  id: string;
  status: string;
  created_at: string;
};

export function AdminDashboard() {
  return (
    <PollarRequired>
      <AdminDashboardInner />
    </PollarRequired>
  );
}

function AdminDashboardInner() {
  const { profile } = useUpeerSession();
  const [pending, setPending] = useState<PendingMerchant[]>([]);
  const [orders, setOrders] = useState<OrderRow[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!profile?.isOperator) {
      return;
    }
    void upeerAuthedFetch('/api/admin/overview')
      .then((r) => r.json())
      .then((data) => {
        if (data.error) {
          setError(data.error);
          return;
        }
        setPending(data.pendingMerchants ?? []);
        setOrders(data.recentOrders ?? []);
      });
  }, [profile?.isOperator]);

  if (!profile?.isOperator) {
    return (
      <p className="text-sm text-muted">
        Operator access required. Set <code>is_operator</code> on your profile in
        Supabase.
      </p>
    );
  }

  const decide = async (id: string, decision: 'approved' | 'rejected') => {
    const res = await upeerAuthedFetch(`/api/admin/merchants/${id}/decision`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ decision }),
    });
    const data = await res.json();
    if (!res.ok) {
      setError(data.error ?? 'Decision failed');
      return;
    }
    setPending((list) => list.filter((m) => m.id !== id));
  };

  return (
    <div className="space-y-8">
      {error ? <p className="text-sm text-red-600">{error}</p> : null}
      <section className="panel-card">
        <h2 className="text-headline text-sm">Pending merchant verification</h2>
        <ul className="mt-4 space-y-2 text-sm">
          {pending.length === 0 ? (
            <li className="text-muted">None pending</li>
          ) : (
            pending.map((m) => (
              <li
                key={m.id}
                className="flex flex-wrap items-center justify-between gap-2 border-b border-[var(--line)] py-2"
              >
                <span>{m.display_name}</span>
                <span className="flex gap-2">
                  <button
                    type="button"
                    className="btn-primary !min-h-8 !px-3 !text-xs"
                    onClick={() => void decide(m.id, 'approved')}
                  >
                    Approve
                  </button>
                  <button
                    type="button"
                    className="btn-secondary !min-h-8 !px-3 !text-xs"
                    onClick={() => void decide(m.id, 'rejected')}
                  >
                    Reject
                  </button>
                </span>
              </li>
            ))
          )}
        </ul>
      </section>
      <section className="panel-card">
        <h2 className="text-headline text-sm">Recent orders</h2>
        <ul className="mt-4 space-y-2 font-mono text-xs">
          {orders.map((o) => (
            <li key={o.id}>
              {o.id.slice(0, 8)}… · {o.status}
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
