'use client';

import { useRouter } from 'next/navigation';
import { usePollar } from '@pollar/react';
import { useState } from 'react';
import type { MarketOffer } from '@/lib/data/offers';
import { formatPricePerUsdc } from '@/lib/market/format';
import { PollarRequired } from '@/components/pollar-required';
import {
  exchangePollarSessionFromClient,
  readStoredSession,
  upeerAuthedFetch,
} from '@/lib/upeer-api';

type Props = {
  offer: MarketOffer;
};

export function TradeFlowClient({ offer }: Props) {
  return (
    <PollarRequired>
      <TradeFlowClientInner offer={offer} />
    </PollarRequired>
  );
}

function TradeFlowClientInner({ offer }: Props) {
  const router = useRouter();
  const { isAuthenticated, verified, getClient } = usePollar();
  const [usdcAmount, setUsdcAmount] = useState('100.0000000');
  const [status, setStatus] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

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

  const requestTrade = async () => {
    setBusy(true);
    setStatus(null);
    try {
      await ensureSession();
      const quoteRes = await upeerAuthedFetch('/api/quotes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ offerId: offer.id, usdcAmount }),
      });
      const quoteData = await quoteRes.json();
      if (!quoteRes.ok) {
        throw new Error(quoteData.error ?? 'Quote failed');
      }

      const orderRes = await upeerAuthedFetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ quoteId: quoteData.quote.id }),
      });
      const orderData = await orderRes.json();
      if (!orderRes.ok) {
        throw new Error(orderData.error ?? 'Request failed');
      }

      router.push(`/orders/${orderData.order.id}`);
    } catch (e: unknown) {
      setStatus(e instanceof Error ? e.message : 'Request failed');
    } finally {
      setBusy(false);
    }
  };

  const canTrade = isAuthenticated && verified;

  return (
    <div className="space-y-6">
      <p className="text-sm text-[var(--foreground-secondary)]">
        Price: {formatPricePerUsdc(offer.fiatCurrency, offer.pricePerUsdc)} per
        USDC
      </p>
      <label className="field-label" htmlFor="trade-usdc-amount">
        USDC amount
      </label>
      <input
        id="trade-usdc-amount"
        className="field-input tabular-nums"
        value={usdcAmount}
        onChange={(e) => setUsdcAmount(e.target.value)}
      />
      {!canTrade ? (
        <p className="text-sm text-amber-700 dark:text-amber-300">
          Sign in with Pollar to request this trade.
        </p>
      ) : null}
      <button
        type="button"
        className="btn-primary"
        disabled={!canTrade || busy}
        onClick={() => void requestTrade()}
      >
        Request trade
      </button>
      {status ? (
        <p className="text-sm text-muted" role="status">{status}</p>
      ) : null}
      <p className="text-xs text-[var(--foreground-tertiary)]">
        The maker must accept before escrow. Fiat settles P2P off-chain.
      </p>
    </div>
  );
}
