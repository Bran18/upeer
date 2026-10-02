'use client';

import { usePollar } from '@pollar/react';
import { useCallback, useEffect, useState } from 'react';
import { PollarRequired } from '@/components/pollar-required';
import { exchangePollarSession, readStoredSession } from '@/lib/upeer-api';

type Merchant = {
  id: string;
  status: string;
  display_name: string;
  payout_address: string | null;
};

type OfferRow = {
  id: string;
  side: string;
  fiat_currency: string;
  spread_bps: number;
  available_usdc: string;
  status: string;
};

export function MerchantDashboard() {
  return (
    <PollarRequired>
      <MerchantDashboardInner />
    </PollarRequired>
  );
}

function MerchantDashboardInner() {
  const { isAuthenticated, verified, getClient } = usePollar();
  const [merchant, setMerchant] = useState<Merchant | null>(null);
  const [offers, setOffers] = useState<OfferRow[]>([]);
  const [status, setStatus] = useState<string | null>(null);
  const [payoutAddress, setPayoutAddress] = useState('');
  const [offerForm, setOfferForm] = useState({
    side: 'sell_usdc' as 'sell_usdc' | 'buy_usdc',
    fiatCurrency: 'COP',
    spreadBps: 50,
    minUsdc: '50.0000000',
    maxUsdc: '5000.0000000',
    availableUsdc: '1000.0000000',
  });

  const ensureSession = useCallback(async () => {
    let session = readStoredSession();
    if (!session) {
      const auth = getClient().getAuthState();
      if (auth.step !== 'authenticated') {
        throw new Error('Sign in with Pollar first');
      }
      session = await exchangePollarSession(auth.session.token.accessToken);
    }
    return session;
  }, [getClient]);

  const refresh = useCallback(async () => {
    await ensureSession();
    const meRes = await fetch('/api/merchants/me', { credentials: 'include' });
    const meData = await meRes.json();
    if (!meRes.ok) {
      throw new Error(meData.error ?? 'Could not load merchant');
    }
    setMerchant(meData.merchant);
    if (meData.merchant?.payout_address) {
      setPayoutAddress(meData.merchant.payout_address);
    }

    const offersRes = await fetch('/api/offers', { credentials: 'include' });
    const offersData = await offersRes.json();
    if (offersRes.ok) {
      setOffers(offersData.offers ?? []);
    }
  }, [ensureSession]);

  useEffect(() => {
    if (isAuthenticated && verified) {
      void refresh().catch((e: unknown) => {
        setStatus(e instanceof Error ? e.message : 'Load failed');
      });
    }
  }, [isAuthenticated, verified, refresh]);

  const savePayout = async () => {
    setStatus(null);
    try {
      await ensureSession();
      const res = await fetch('/api/merchants/payout-address', {
        method: 'PATCH',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ payoutAddress }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error ?? 'Save failed');
      }
      setStatus('Payout address saved.');
      await refresh();
    } catch (e: unknown) {
      setStatus(e instanceof Error ? e.message : 'Save failed');
    }
  };

  const publishOffer = async () => {
    setStatus(null);
    try {
      await ensureSession();
      const res = await fetch('/api/offers', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          side: offerForm.side,
          fiatCurrency: offerForm.fiatCurrency,
          spreadBps: offerForm.spreadBps,
          minUsdc: offerForm.minUsdc,
          maxUsdc: offerForm.maxUsdc,
          availableUsdc: offerForm.availableUsdc,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error ?? 'Publish failed');
      }
      setStatus(`Offer published: ${data.id}`);
      await refresh();
    } catch (e: unknown) {
      setStatus(e instanceof Error ? e.message : 'Publish failed');
    }
  };

  if (!merchant) {
    return (
      <p className="text-sm text-zinc-500">
        No merchant record yet — submit an application below.
      </p>
    );
  }

  return (
    <div className="mt-10 space-y-8 border-t border-zinc-200 pt-10 dark:border-zinc-800">
      <section>
        <h2 className="font-semibold">Merchant status</h2>
        <p className="mt-1 text-sm capitalize text-zinc-600 dark:text-zinc-400">
          {merchant.status} · {merchant.display_name}
        </p>
      </section>

      {merchant.status === 'approved' ? (
        <>
          <section className="space-y-3">
            <h3 className="text-sm font-medium">Escrow payout address (G…)</h3>
            <input
              className="w-full rounded-lg border border-zinc-300 px-3 py-2 font-mono text-sm dark:border-zinc-700 dark:bg-zinc-950"
              value={payoutAddress}
              onChange={(e) => setPayoutAddress(e.target.value)}
              placeholder="G..."
            />
            <button
              type="button"
              onClick={() => void savePayout()}
              className="rounded-lg border border-zinc-300 px-3 py-2 text-sm dark:border-zinc-700"
            >
              Save payout address
            </button>
          </section>

          <section className="space-y-3">
            <h3 className="text-sm font-medium">Publish offer</h3>
            <div className="grid gap-2 sm:grid-cols-2">
              <label className="text-sm">
                Side
                <select
                  className="mt-1 w-full rounded-lg border border-zinc-300 px-2 py-2 dark:border-zinc-700 dark:bg-zinc-950"
                  value={offerForm.side}
                  onChange={(e) =>
                    setOfferForm((f) => ({
                      ...f,
                      side: e.target.value as 'sell_usdc' | 'buy_usdc',
                    }))
                  }
                >
                  <option value="sell_usdc">Merchant sells USDC</option>
                  <option value="buy_usdc">Merchant buys USDC</option>
                </select>
              </label>
              <label className="text-sm">
                Fiat
                <input
                  className="mt-1 w-full rounded-lg border border-zinc-300 px-2 py-2 dark:border-zinc-700 dark:bg-zinc-950"
                  value={offerForm.fiatCurrency}
                  onChange={(e) =>
                    setOfferForm((f) => ({ ...f, fiatCurrency: e.target.value }))
                  }
                />
              </label>
            </div>
            <button
              type="button"
              onClick={() => void publishOffer()}
              className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white"
            >
              Publish to market
            </button>
          </section>

          {offers.length > 0 ? (
            <section>
              <h3 className="text-sm font-medium">Your offers</h3>
              <ul className="mt-2 space-y-2 text-sm">
                {offers.map((o) => (
                  <li key={o.id} className="font-mono text-xs">
                    <a href={`/trade/${o.id}`} className="text-emerald-700 hover:underline">
                      {o.id.slice(0, 8)}…
                    </a>
                    {' '}
                    {o.side} · {o.fiat_currency} · {o.available_usdc} USDC left
                  </li>
                ))}
              </ul>
            </section>
          ) : null}
        </>
      ) : (
        <p className="text-sm text-amber-700 dark:text-amber-300">
          Waiting for operator approval before you can publish offers.
        </p>
      )}

      {status ? (
        <p className="text-sm text-zinc-600 dark:text-zinc-400">{status}</p>
      ) : null}
    </div>
  );
}
