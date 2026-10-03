'use client';

import type { ExchangeSide } from '@/lib/exchange/match';

type ExchangeDirectionProps = {
  side: ExchangeSide;
  fiatCurrency: string;
  onChange: (side: ExchangeSide) => void;
};

export function ExchangeDirection({
  side,
  fiatCurrency,
  onChange,
}: ExchangeDirectionProps) {
  const wantLabel = side === 'buy' ? 'USDC' : fiatCurrency;
  const payLabel = side === 'buy' ? fiatCurrency : 'USDC';

  return (
    <div className="exchange-stage">
      <div className="exchange-stage-copy">
        <p className="exchange-kicker">You want</p>
        <p className="exchange-stage-headline">
          {wantLabel}
          <span> for {payLabel}</span>
        </p>
      </div>

      <div className="exchange-stage-picks" role="radiogroup" aria-label="Asset you want">
        <button
          type="button"
          role="radio"
          aria-checked={side === 'buy'}
          className="exchange-pick"
          onClick={() => onChange('buy')}
        >
          USDC
        </button>
        <button
          type="button"
          role="radio"
          aria-checked={side === 'sell'}
          className="exchange-pick"
          onClick={() => onChange('sell')}
        >
          {fiatCurrency}
        </button>
      </div>
    </div>
  );
}
