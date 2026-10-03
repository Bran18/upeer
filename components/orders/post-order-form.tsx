'use client';

import { usePollar } from '@pollar/react';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { PollarRequired } from '@/components/pollar-required';
import { FiatMarketSelect } from '@/components/fiat/fiat-market-select';
import {
  DEFAULT_FIAT_CURRENCY,
  marketForCurrency,
} from '@/lib/fiat/coverage';
import {
  exchangePollarSessionFromClient,
  readStoredSession,
  upeerAuthedFetch,
} from '@/lib/upeer-api';

export function PostOrderForm() {
  return (
    <PollarRequired>
      <PostOrderFormInner />
    </PollarRequired>
  );
}

function PostOrderFormInner() {
  const router = useRouter();
  const { isAuthenticated, verified, getClient } = usePollar();
  const [status, setStatus] = useState<string | null>(null);
  const [form, setForm] = useState({
    side: 'sell_usdc' as 'sell_usdc' | 'buy_usdc',
    fiatCurrency: DEFAULT_FIAT_CURRENCY,
    pricePerUsdc: marketForCurrency(DEFAULT_FIAT_CURRENCY)?.examplePricePerUsdc ?? '520',
    minUsdc: '50.0000000',
    maxUsdc: '5000.0000000',
    availableUsdc: '1000.0000000',
    payoutAddress: '',
  });

  const ensureSession = async () => {
    let session = readStoredSession();
    if (!session) {
      const auth = getClient().getAuthState();
      if (auth.step !== 'authenticated') {
        throw new Error('Sign in with Pollar first');
      }
      session = await exchangePollarSessionFromClient(getClient());
    }
    return session;
  };

  const submit = async () => {
    setStatus(null);
    try {
      await ensureSession();
      const res = await upeerAuthedFetch('/api/offers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          side: form.side,
          fiatCurrency: form.fiatCurrency,
          pricePerUsdc: form.pricePerUsdc,
          minUsdc: form.minUsdc,
          maxUsdc: form.maxUsdc,
          availableUsdc: form.availableUsdc,
          ...(form.payoutAddress.trim()
            ? { payoutAddress: form.payoutAddress.trim() }
            : {}),
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error ?? 'Failed to post order');
      }
      setStatus('Order posted.');
      router.push('/market');
      router.refresh();
    } catch (e: unknown) {
      setStatus(e instanceof Error ? e.message : 'Failed');
    }
  };

  if (!isAuthenticated || !verified) {
    return (
      <p className="text-sm text-[var(--foreground-secondary)]">
        Sign in to post an order on the market.
      </p>
    );
  }

  return (
    <div className="panel-card space-y-4">
      <p className="text-sm text-[var(--foreground-secondary)]">
        Set your price as fiat per 1 USDC. Buyers will request a trade; you
        accept before escrow starts.
      </p>
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="field-label" htmlFor="post-side">Side</label>
          <select
            id="post-side"
            className="field-input"
            value={form.side}
            onChange={(e) =>
              setForm((f) => ({
                ...f,
                side: e.target.value as 'sell_usdc' | 'buy_usdc',
              }))
            }
          >
            <option value="sell_usdc">I sell USDC</option>
            <option value="buy_usdc">I buy USDC</option>
          </select>
        </div>
        <FiatMarketSelect
          id="post-fiat"
          value={form.fiatCurrency}
          onChange={(currency) => {
            const market = marketForCurrency(currency);
            setForm((f) => ({
              ...f,
              fiatCurrency: currency,
              pricePerUsdc: market?.examplePricePerUsdc ?? f.pricePerUsdc,
            }));
          }}
        />
        <div>
          <label className="field-label" htmlFor="post-price">Price per USDC</label>
          <p className="mt-1 text-xs text-[var(--foreground-tertiary)]">
            Local currency for {form.fiatCurrency} (peer-to-peer, off-chain).
          </p>
          <input
            id="post-price"
            className="field-input tabular-nums mt-2"
            value={form.pricePerUsdc}
            onChange={(e) =>
              setForm((f) => ({ ...f, pricePerUsdc: e.target.value }))
            }
          />
        </div>
        <div>
          <label className="field-label" htmlFor="post-payout">Payout address (G…)</label>
          <input
            id="post-payout"
            className="field-input font-mono text-sm"
            placeholder="Required if not saved"
            value={form.payoutAddress}
            onChange={(e) =>
              setForm((f) => ({ ...f, payoutAddress: e.target.value }))
            }
          />
        </div>
        <div>
          <label className="field-label" htmlFor="post-available">Size (USDC)</label>
          <input
            id="post-available"
            className="field-input tabular-nums"
            value={form.availableUsdc}
            onChange={(e) =>
              setForm((f) => ({ ...f, availableUsdc: e.target.value }))
            }
          />
        </div>
        <div>
          <label className="field-label" htmlFor="post-min">Min / max USDC</label>
          <div className="flex gap-2">
            <input
              id="post-min"
              className="field-input tabular-nums"
              value={form.minUsdc}
              onChange={(e) =>
                setForm((f) => ({ ...f, minUsdc: e.target.value }))
              }
            />
            <input
              className="field-input tabular-nums"
              value={form.maxUsdc}
              onChange={(e) =>
                setForm((f) => ({ ...f, maxUsdc: e.target.value }))
              }
            />
          </div>
        </div>
      </div>
      <button type="button" className="btn-primary" onClick={() => void submit()}>
        Post to market
      </button>
      {status ? (
        <p className="text-sm text-muted" role="status">{status}</p>
      ) : null}
    </div>
  );
}
