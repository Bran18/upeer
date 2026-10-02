'use client';

import { usePollar } from '@pollar/react';
import { useState } from 'react';
import type { MarketOffer } from '@/lib/data/offers';
import { TradeStepper } from '@/components/trade-stepper';
import { QuoteCard } from '@/components/quote-card';
import { EscrowStatus } from '@/components/escrow-status';
import { PollarRequired } from '@/components/pollar-required';
import {
  exchangePollarSessionFromClient,
  readStoredSession,
  upeerAuthedFetch,
} from '@/lib/upeer-api';

type Props = {
  offer: MarketOffer;
};

type QuotePreview = {
  referencePrice: string;
  fiatAmount: string;
  expiresAt: string;
  quoteId?: string;
};

export function TradeFlowClient({ offer }: Props) {
  return (
    <PollarRequired>
      <TradeFlowClientInner offer={offer} />
    </PollarRequired>
  );
}

function TradeFlowClientInner({ offer }: Props) {
  const { isAuthenticated, verified, signAndSubmitTx, wallet, getClient } =
    usePollar();
  const [step, setStep] = useState(0);
  const [usdcAmount, setUsdcAmount] = useState('100.0000000');
  const [preview, setPreview] = useState<QuotePreview | null>(null);
  const [orderId, setOrderId] = useState<string | null>(null);
  const [engagementId, setEngagementId] = useState<string | null>(null);
  const [status, setStatus] = useState<string | null>(null);
  const [escrowContract, setEscrowContract] = useState<string | null>(null);

  const isRealOffer = offer.id.includes('-');

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

  const fetchQuote = async () => {
    if (isRealOffer) {
      await ensureSession();
      const res = await upeerAuthedFetch('/api/quotes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ offerId: offer.id, usdcAmount }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error ?? 'Quote failed');
      }
      setPreview({
        referencePrice: data.preview.referencePrice,
        fiatAmount: data.preview.fiatAmount,
        expiresAt: data.preview.expiresAt,
        quoteId: data.quote.id,
      });
      setStep(1);
      return;
    }

    const res = await fetch(
      `/api/prices/reference?symbols=${offer.fiatCurrency}&fresh=true`,
    );
    const data = await res.json();
    const quote = data.quotes?.find(
      (q: { symbol: string }) => q.symbol === offer.fiatCurrency,
    );
    if (!quote || quote.stale) {
      throw new Error('Reference price unavailable or stale');
    }
    const ref = Number(quote.price);
    const spread = 1 + offer.spreadBps / 10000;
    setPreview({
      referencePrice: quote.price,
      fiatAmount: (Number(usdcAmount) * ref * spread).toFixed(2),
      expiresAt: new Date(Date.now() + 5 * 60 * 1000).toISOString(),
    });
    setStep(1);
  };

  const reserveOrder = async () => {
    if (!preview?.quoteId) {
      setStep(2);
      return;
    }
    await ensureSession();
    const res = await upeerAuthedFetch('/api/orders', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ quoteId: preview.quoteId }),
    });
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error ?? 'Reserve failed');
    }
    setOrderId(data.order.id);
    setEngagementId(data.order.engagement_id);
    setStep(2);
    setStatus(`Order reserved · engagement ${data.order.engagement_id.slice(0, 8)}…`);
  };

  const deployEscrow = async () => {
    if (!wallet?.address) {
      return;
    }
    const eid = engagementId ?? crypto.randomUUID();
    const res = await upeerAuthedFetch('/api/escrow/deploy', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        engagementId: eid,
        signer: wallet.address,
        amount: Number(usdcAmount),
        side: offer.side,
        buyerAddress: wallet.address,
        merchantLabel: offer.merchantName,
        orderId: orderId ?? undefined,
      }),
    });
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error ?? 'Deploy failed');
    }
    const xdr = data.unsignedTransaction ?? data.xdr;
    if (!xdr) {
      throw new Error('No unsigned XDR returned');
    }
    const outcome = await signAndSubmitTx(xdr);
    setEscrowContract(data.contractId ?? eid);
    setStep(3);
    if (outcome.status === 'success') {
      setStatus(`Escrow deploy submitted: ${outcome.hash}`);
    } else if (outcome.status === 'error' && 'message' in outcome) {
      setStatus(
        typeof outcome.message === 'string'
          ? outcome.message
          : 'Escrow deploy failed',
      );
    } else {
      setStatus('Escrow deploy submitted');
    }
  };

  const canTrade = isAuthenticated && verified;

  return (
    <div className="space-y-8">
      <TradeStepper activeStep={step} />

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="space-y-4">
          <label className="field-label" htmlFor="trade-usdc-amount">
            USDC amount
          </label>
          <input
            id="trade-usdc-amount"
            name="usdcAmount"
            type="text"
            inputMode="decimal"
            spellCheck={false}
            autoComplete="off"
            className="field-input tabular-nums"
            value={usdcAmount}
            onChange={(e) => setUsdcAmount(e.target.value)}
          />
          {!canTrade ? (
            <p className="text-sm text-amber-700 dark:text-amber-300">
              Sign in with Pollar and wait for session verification to continue.
            </p>
          ) : null}
          <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
            <button
              type="button"
              disabled={!canTrade}
              onClick={() =>
                void fetchQuote().catch((e: unknown) =>
                  setStatus(e instanceof Error ? e.message : 'Quote failed'),
                )
              }
              className="btn-primary w-full sm:w-auto"
            >
              Get Executable Quote
            </button>
            {isRealOffer ? (
              <button
                type="button"
                disabled={!canTrade || step < 1}
                onClick={() =>
                  void reserveOrder().catch((e: unknown) =>
                    setStatus(e instanceof Error ? e.message : 'Reserve failed'),
                  )
                }
                className="btn-secondary w-full sm:w-auto"
              >
                Reserve Liquidity
              </button>
            ) : null}
            <button
              type="button"
              disabled={!canTrade || step < 1}
              onClick={() =>
                void deployEscrow().catch((e: unknown) =>
                  setStatus(e instanceof Error ? e.message : 'Escrow failed'),
                )
              }
              className="btn-secondary w-full sm:w-auto"
            >
              Deploy Escrow
            </button>
          </div>
          {status ? (
            <p className="text-sm text-muted" role="status" aria-live="polite">
              {status}
            </p>
          ) : null}
        </div>

        {preview ? (
          <QuoteCard
            fiatCurrency={offer.fiatCurrency}
            usdcAmount={usdcAmount}
            fiatAmount={preview.fiatAmount}
            referencePrice={preview.referencePrice}
            spreadBps={offer.spreadBps}
            expiresAt={preview.expiresAt}
          />
        ) : null}
      </div>

      <EscrowStatus
        state={step >= 3 ? 'escrow_pending' : 'idle'}
        contractId={escrowContract}
      />

      <p className="text-xs text-subtle">
        Fiat leg is off-chain. On testnet, a payment declaration does not confirm
        fiat settlement.
      </p>
    </div>
  );
}
