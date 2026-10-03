'use client';

import { useEffect, useId, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { usePollar } from '@pollar/react';
import type { MarketOffer } from '@/lib/data/offers';
import { fiatFromUsdc, parseAmount } from '@/lib/exchange/match';
import {
  buyerActionLabel,
  formatFiatTotal,
  formatUsdcAmount,
  formatUsdcLabel,
} from '@/lib/market/format';
import {
  amountInFillRange,
  defaultTakeUsdc,
  offerFillBounds,
} from '@/lib/market/take';
import {
  defaultPaymentMethodId,
  PaymentMethodPicker,
} from '@/components/orders/payment-method-picker';
import { PollarRequired } from '@/components/pollar-required';
import { useUpeerSession } from '@/components/session/upeer-session-provider';
import { EMPTY_PAYMENT_PREFS } from '@/lib/profile/payment-prefs';
import { Button } from '@/components/ui/button';
import {
  exchangePollarSessionFromClient,
  readStoredSession,
  upeerAuthedFetch,
} from '@/lib/upeer-api';

type Props = {
  offer: MarketOffer;
  initialUsdc?: string;
};

export function TradeFlowClient({ offer, initialUsdc }: Props) {
  return (
    <PollarRequired
      fallback={
        <div className="ui-card px-5 py-5 sm:px-6 sm:py-6">
          <p className="text-sm text-muted">
            Set{' '}
            <code className="font-mono text-xs">
              NEXT_PUBLIC_POLLAR_PUBLISHABLE_KEY
            </code>{' '}
            to request this trade.
          </p>
        </div>
      }
    >
      <TradeFlowClientInner offer={offer} initialUsdc={initialUsdc} />
    </PollarRequired>
  );
}

function TradeFlowClientInner({ offer, initialUsdc }: Props) {
  const router = useRouter();
  const errorId = useId();
  const hintId = useId();
  const amountRef = useRef<HTMLInputElement>(null);
  const { isAuthenticated, verified, getClient, openLoginModal } = usePollar();
  const [usdcAmount, setUsdcAmount] = useState(() =>
    defaultTakeUsdc(offer, initialUsdc),
  );
  const [status, setStatus] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const { profile } = useUpeerSession();
  const [paymentMethodId, setPaymentMethodId] = useState<string | null>(null);
  const takerReceivesFiat = offer.side === 'buy_usdc';
  const paymentPrefs = profile?.paymentPrefs ?? EMPTY_PAYMENT_PREFS;

  useEffect(() => {
    if (!takerReceivesFiat) {
      return;
    }
    setPaymentMethodId(
      defaultPaymentMethodId(paymentPrefs, offer.fiatCurrency),
    );
  }, [takerReceivesFiat, paymentPrefs, offer.fiatCurrency]);

  const { min, max } = offerFillBounds(offer);
  const amount = parseAmount(usdcAmount);
  const inRange = amountInFillRange(amount, offer);
  const price = Number(offer.pricePerUsdc);
  const fiatTotal =
    amount > 0 && Number.isFinite(price) ? fiatFromUsdc(amount, price) : 0;
  const buyingUsdc = offer.side === 'sell_usdc';
  const action = buyerActionLabel(offer.side);

  const rangeHint = `Enter ${formatUsdcAmount(String(min))}–${formatUsdcAmount(String(max))}\u00a0USDC.`;
  const amountError =
    usdcAmount.trim() !== '' && amount > 0 && !inRange ? rangeHint : null;

  const ensureSession = async () => {
    let session = readStoredSession();
    if (!session) {
      const auth = getClient().getAuthState();
      if (auth.step !== 'authenticated') {
        throw new Error('Sign in with Pollar first.');
      }
      session = await exchangePollarSessionFromClient(getClient());
    }
    return session;
  };

  const requestTrade = async () => {
    if (!inRange) {
      setStatus(rangeHint);
      amountRef.current?.focus();
      return;
    }

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
        throw new Error(quoteData.error ?? 'Quote failed. Try a different size.');
      }

      const orderBody: { quoteId: string; paymentMethodId?: string } = {
        quoteId: quoteData.quote.id,
      };
      if (takerReceivesFiat) {
        if (!paymentMethodId) {
          throw new Error(
            'Choose how you receive fiat for this trade before requesting.',
          );
        }
        orderBody.paymentMethodId = paymentMethodId;
      }

      const orderRes = await upeerAuthedFetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(orderBody),
      });
      const orderData = await orderRes.json();
      if (!orderRes.ok) {
        throw new Error(
          orderData.error ?? 'Could not start this order. Try again.',
        );
      }

      router.push(`/orders/${orderData.order.id}`);
    } catch (e: unknown) {
      setStatus(e instanceof Error ? e.message : 'Request failed. Try again.');
    } finally {
      setBusy(false);
    }
  };

  const canTrade = isAuthenticated && verified;
  const submitLabel = busy
    ? 'Requesting…'
    : canTrade
      ? `Request ${action}`
      : 'Sign in to Trade';

  return (
    <form
      className="ui-card flex flex-col px-5 py-5 sm:px-6 sm:py-6"
      onSubmit={(event) => {
        event.preventDefault();
        if (!canTrade) {
          openLoginModal();
          return;
        }
        void requestTrade();
      }}
    >
      <h2 className="text-base font-semibold tracking-tight">Take This Offer</h2>
      <p className="mt-1 text-sm text-[var(--foreground-secondary)] text-pretty">
        Lock the size now. The fiat total uses this desk’s posted price.
      </p>

      <div className="mt-6">
        <label className="field-label" htmlFor="trade-usdc-amount">
          USDC amount
        </label>
        <input
          ref={amountRef}
          id="trade-usdc-amount"
          name="usdcAmount"
          className="field-input tabular-nums"
          inputMode="decimal"
          autoComplete="off"
          spellCheck={false}
          placeholder={`${formatUsdcAmount(String(min))}…`}
          value={usdcAmount}
          aria-invalid={amountError ? true : undefined}
          aria-describedby={
            amountError ? `${errorId} ${hintId}` : hintId
          }
          onChange={(event) => {
            setUsdcAmount(event.target.value);
            setStatus(null);
          }}
        />
        <p
          id={hintId}
          className="mt-2 text-xs text-[var(--foreground-tertiary)] tabular-nums"
        >
          {rangeHint} Available {formatUsdcLabel(offer.availableUsdc)}.
        </p>
        {amountError ? (
          <p id={errorId} className="mt-2 text-sm text-red-400" role="alert">
            {amountError}
          </p>
        ) : null}
      </div>

      <div className="mt-3 flex flex-wrap gap-2">
        <PresetButton
          label="Min"
          disabled={busy}
          onClick={() => setUsdcAmount(String(min))}
        />
        <PresetButton
          label="Half"
          disabled={busy || max <= 0}
          onClick={() =>
            setUsdcAmount(String(Math.max(min, Math.floor((max / 2) * 100) / 100)))
          }
        />
        <PresetButton
          label="Max"
          disabled={busy}
          onClick={() => setUsdcAmount(String(max))}
        />
      </div>

      <dl className="mt-6 space-y-3 border-t border-[var(--line)] pt-5">
        <div className="flex items-baseline justify-between gap-4">
          <dt className="text-sm text-[var(--foreground-tertiary)]">
            You {buyingUsdc ? 'receive' : 'send'}
          </dt>
          <dd className="text-sm font-medium tabular-nums">
            {amount > 0 ? formatUsdcLabel(amount) : '—'}
          </dd>
        </div>
        <div className="flex items-baseline justify-between gap-4">
          <dt className="text-sm text-[var(--foreground-tertiary)]">
            You {buyingUsdc ? 'pay' : 'receive'}
          </dt>
          <dd className="text-lg font-semibold tabular-nums tracking-tight">
            {formatFiatTotal(offer.fiatCurrency, fiatTotal)}
          </dd>
        </div>
      </dl>

      {takerReceivesFiat && canTrade ? (
        <div className="mt-6 border-t border-[var(--line)] pt-5">
          <PaymentMethodPicker
            currency={offer.fiatCurrency}
            prefs={paymentPrefs}
            value={paymentMethodId}
            onChange={setPaymentMethodId}
            disabled={busy}
            legend="How you receive fiat"
          />
        </div>
      ) : null}

      <Button
        type="submit"
        className="mt-6"
        fullWidth
        disabled={busy || (takerReceivesFiat && canTrade && !paymentMethodId)}
      >
        {submitLabel}
      </Button>

      {status ? (
        <p className="mt-3 text-sm text-red-400" role="status" aria-live="polite">
          {status}
        </p>
      ) : null}

      {!canTrade ? (
        <p className="mt-3 text-sm text-[var(--foreground-secondary)] text-pretty">
          Sign in with Pollar and finish verification before you request a
          trade.
        </p>
      ) : null}
    </form>
  );
}

function PresetButton({
  label,
  disabled,
  onClick,
}: {
  label: string;
  disabled: boolean;
  onClick: () => void;
}) {
  return (
    <Button
      type="button"
      variant="secondary"
      size="sm"
      disabled={disabled}
      onClick={onClick}
    >
      {label}
    </Button>
  );
}
