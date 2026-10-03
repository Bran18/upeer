'use client';

import { usePollar } from '@pollar/react';
import { useRouter } from 'next/navigation';
import { useMemo, useState } from 'react';
import { hasPollarPublishableKey } from '@/components/pollar-required';
import { Button } from '@/components/ui/button';
import {
  UPEER_FIAT_CURRENCIES,
  defaultRailForCurrency,
  railsForCurrency,
  type PaymentRail,
} from '@/lib/fiat/coverage';
import type { MarketOffer } from '@/lib/data/offers';
import {
  fallbackPrice,
  fiatFromUsdc,
  formatExchangeNumber,
  matchBestOffer,
  parseAmount,
  usdcFromFiat,
  type ExchangeSide,
} from '@/lib/exchange/match';
import { ExchangeDirection } from '@/components/exchange/exchange-direction';
import { cn } from '@/lib/cn';

type ExchangeWidgetProps = {
  offers: MarketOffer[];
  className?: string;
};

export function ExchangeWidget({ offers, className }: ExchangeWidgetProps) {
  if (!hasPollarPublishableKey()) {
    return <ExchangeWidgetInner offers={offers} className={className} />;
  }
  return <ExchangeWidgetAuthed offers={offers} className={className} />;
}

function ExchangeWidgetAuthed(props: ExchangeWidgetProps) {
  const { isAuthenticated, openLoginModal } = usePollar();
  return (
    <ExchangeWidgetInner
      {...props}
      isAuthenticated={isAuthenticated}
      onNeedAuth={() => openLoginModal()}
    />
  );
}

function ExchangeWidgetInner({
  offers,
  className,
  isAuthenticated = false,
  onNeedAuth,
}: ExchangeWidgetProps & {
  isAuthenticated?: boolean;
  onNeedAuth?: () => void;
}) {
  const router = useRouter();
  const [side, setSide] = useState<ExchangeSide>('buy');
  const [fiatCurrency, setFiatCurrency] = useState('ARS');
  const [payInput, setPayInput] = useState('150000');
  const [rail, setRail] = useState<PaymentRail>(defaultRailForCurrency('ARS'));

  const availableRails = railsForCurrency(fiatCurrency);
  const payAmount = parseAmount(payInput);

  const indicativePrice = useMemo(() => {
    const preview = matchBestOffer(offers, {
      side,
      fiatCurrency,
      usdcAmount: 0,
    });
    const fromOffer = preview ? Number(preview.pricePerUsdc) : 0;
    return fromOffer > 0 ? fromOffer : fallbackPrice(fiatCurrency);
  }, [offers, side, fiatCurrency]);

  const usdcAmount =
    side === 'buy'
      ? usdcFromFiat(payAmount, indicativePrice)
      : payAmount;
  const receiveAmount =
    side === 'buy'
      ? usdcAmount
      : fiatFromUsdc(payAmount, indicativePrice);

  const matched = matchBestOffer(offers, {
    side,
    fiatCurrency,
    usdcAmount,
  });

  const receiveAsset = side === 'buy' ? 'USDC' : fiatCurrency;
  const receiveDisplay = formatExchangeNumber(receiveAmount, {
    currency: receiveAsset,
  });

  function handleFiatChange(next: string) {
    setFiatCurrency(next);
    const nextRails = railsForCurrency(next);
    if (!nextRails.some((option) => option.value === rail)) {
      setRail(defaultRailForCurrency(next));
    }
  }

  function handleGetQuote() {
    if (payAmount <= 0) {
      return;
    }
    if (!isAuthenticated) {
      onNeedAuth?.();
      return;
    }
    if (!matched) {
      router.push(
        `/market?fiat=${encodeURIComponent(fiatCurrency)}&side=${
          side === 'buy' ? 'sell_usdc' : 'buy_usdc'
        }`,
      );
      return;
    }
    const usdcParam =
      side === 'buy' ? usdcAmount.toFixed(7) : payAmount.toFixed(7);
    router.push(`/trade/${matched.id}?usdc=${encodeURIComponent(usdcParam)}`);
  }

  const quoteLabel = !isAuthenticated
    ? 'Sign in to get a quote'
    : matched
      ? 'Get quote'
      : 'See available offers';

  const matchHint = matched
    ? `Matched with ${matched.merchantName}`
    : payAmount > 0
      ? 'No live match at this size yet. You can still browse offers.'
      : 'Enter an amount to see what you receive.';

  return (
    <div className={cn('exchange-shell', className)}>
      <div className="exchange-card">
        <ExchangeDirection
          side={side}
          fiatCurrency={fiatCurrency}
          onChange={(value) => {
            setSide(value);
            setPayInput(value === 'buy' ? '150000' : '100');
          }}
        />

        <div className="exchange-legs">
          <div className="exchange-leg exchange-leg--pay">
            <p className="exchange-kicker">You pay</p>
            <div className="mt-3 flex items-end justify-between gap-3">
              <label className="sr-only" htmlFor="exchange-pay">
                Amount you pay
              </label>
              <input
                id="exchange-pay"
                className="exchange-amount tabular-nums"
                inputMode="decimal"
                autoComplete="off"
                spellCheck={false}
                value={payInput}
                onChange={(event) => setPayInput(event.target.value)}
              />
              {side === 'buy' ? (
                <FiatSelect
                  value={fiatCurrency}
                  label="Currency you pay"
                  onChange={handleFiatChange}
                />
              ) : (
                <span className="exchange-asset">USDC</span>
              )}
            </div>
          </div>

          <div className="exchange-join" aria-hidden>
            <div className="exchange-join-mark" />
          </div>

          <div className="exchange-leg exchange-leg--receive">
            <p className="exchange-kicker">You receive</p>
            <div className="mt-3 flex items-end justify-between gap-3">
              <p className="exchange-amount tabular-nums">
                {receiveDisplay === '—' ? '—' : `≈ ${receiveDisplay}`}
              </p>
              {side === 'sell' ? (
                <FiatSelect
                  value={fiatCurrency}
                  label="Currency you receive"
                  onChange={handleFiatChange}
                />
              ) : (
                <span className="exchange-asset">USDC</span>
              )}
            </div>
          </div>
        </div>

        <div className="exchange-meta space-y-3">
          <label className="block">
            <span className="exchange-kicker">Payment method</span>
            <select
              className="field-input mt-2"
              value={rail}
              onChange={(event) => setRail(event.target.value as PaymentRail)}
            >
              {availableRails.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>

          <p className="exchange-hint" role="status">
            {matchHint}
          </p>

          <Button
            type="button"
            size="lg"
            fullWidth
            disabled={payAmount <= 0}
            onClick={handleGetQuote}
          >
            {quoteLabel}
          </Button>
        </div>
      </div>
    </div>
  );
}

function FiatSelect({
  value,
  label,
  onChange,
}: {
  value: string;
  label: string;
  onChange: (value: string) => void;
}) {
  return (
    <select
      aria-label={label}
      className="exchange-asset"
      value={value}
      onChange={(event) => onChange(event.target.value)}
    >
      {UPEER_FIAT_CURRENCIES.map((code) => (
        <option key={code} value={code}>
          {code}
        </option>
      ))}
    </select>
  );
}
