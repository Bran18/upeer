'use client';

import { usePollar } from '@pollar/react';
import { useCallback, useEffect, useState } from 'react';
import { PollarRequired } from '@/components/pollar-required';
import {
  exchangePollarSessionFromClient,
  readStoredSession,
  upeerAuthedFetch,
} from '@/lib/upeer-api';

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
      session = await exchangePollarSessionFromClient(getClient());
    }
    return session;
  }, [getClient]);

  const refresh = useCallback(async () => {
    await ensureSession();
    const meRes = await upeerAuthedFetch('/api/merchants/me');
    const meData = await meRes.json();
    if (!meRes.ok) {
      throw new Error(meData.error ?? 'Could not load merchant');
    }
    setMerchant(meData.merchant);
    if (meData.merchant?.payout_address) {
      setPayoutAddress(meData.merchant.payout_address);
    }

    const offersRes = await upeerAuthedFetch('/api/offers');
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
      const res = await upeerAuthedFetch('/api/merchants/payout-address', {
        method: 'PATCH',
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
      const res = await upeerAuthedFetch('/api/offers', {
        method: 'POST',
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
      <p className="text-sm text-subtle">
        No merchant record yet—submit an application above.
      </p>
    );
  }

  return (
    <div className="space-y-6 border-t border-[var(--line)] pt-10">
      <section className="panel-card">
        <h2 className="text-headline">Merchant Status</h2>
        <p className="mt-2 text-sm capitalize text-muted">
          {merchant.status} · {merchant.display_name}
        </p>
      </section>

      {merchant.status === 'approved' ? (
        <>
          <section className="panel-card space-y-4">
            <h3 className="text-headline text-sm">Escrow Payout Address</h3>
            <label className="field-label" htmlFor="merchant-payout">
              Stellar address (G…)
            </label>
            <input
              id="merchant-payout"
              name="payoutAddress"
              className="field-input font-mono text-sm"
              value={payoutAddress}
              onChange={(e) => setPayoutAddress(e.target.value)}
              placeholder="G…"
              spellCheck={false}
              autoComplete="off"
            />
            <button
              type="button"
              onClick={() => void savePayout()}
              className="btn-secondary"
            >
              Save Payout Address
            </button>
          </section>

          <section className="panel-card space-y-4">
            <h3 className="text-headline text-sm">Publish Offer</h3>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="field-label" htmlFor="offer-side">Side</label>
                <select
                  id="offer-side"
                  name="side"
                  className="field-input"
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
              </div>
              <div>
                <label className="field-label" htmlFor="offer-fiat">Fiat</label>
                <input
                  id="offer-fiat"
                  name="fiatCurrency"
                  className="field-input"
                  value={offerForm.fiatCurrency}
                  onChange={(e) =>
                    setOfferForm((f) => ({ ...f, fiatCurrency: e.target.value }))
                  }
                  spellCheck={false}
                  autoComplete="off"
                />
              </div>
            </div>
            <button
              type="button"
              onClick={() => void publishOffer()}
              className="btn-primary"
            >
              Publish to Market
            </button>
          </section>

          {offers.length > 0 ? (
            <section className="panel-card">
              <h3 className="text-headline text-sm">Your Offers</h3>
              <ul className="mt-3 space-y-2 text-sm">
                {offers.map((o) => (
                  <li key={o.id} className="font-mono text-xs break-all">
                    <a
                      href={`/trade/${o.id}`}
                      className="text-[var(--accent)] hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent)]"
                    >
                      {o.id.slice(0, 8)}…
                    </a>
                    {' '}
                    <span className="text-muted">
                      {o.side} · {o.fiat_currency} · {o.available_usdc} USDC left
                    </span>
                  </li>
                ))}
              </ul>
            </section>
          ) : null}
        </>
      ) : (
        <p className="text-sm text-amber-700 dark:text-amber-300" role="status">
          Waiting for operator approval before you can publish offers.
        </p>
      )}

      {status ? (
        <p className="text-sm text-muted" role="status" aria-live="polite">
          {status}
        </p>
      ) : null}
    </div>
  );
}
