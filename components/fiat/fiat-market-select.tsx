'use client';

import {
  DEFAULT_FIAT_CURRENCY,
  formatMarketLabel,
  UPEER_MARKETS,
} from '@/lib/fiat/coverage';

type Props = {
  id?: string;
  name?: string;
  value: string;
  onChange: (currency: string) => void;
  className?: string;
  label?: string;
  hint?: string;
};

export function FiatMarketSelect({
  id = 'fiat-market',
  name = 'fiatCurrency',
  value,
  onChange,
  className = 'field-input',
  label = 'Country & currency',
  hint = 'Trades settle in this local currency between you and your counterparty.',
}: Props) {
  const selected = value || DEFAULT_FIAT_CURRENCY;

  return (
    <div>
      {label ? <label className="field-label" htmlFor={id}>{label}</label> : null}
      {hint ? (
        <p className="mt-1 text-xs text-[var(--foreground-tertiary)] text-pretty">
          {hint}
        </p>
      ) : null}
      <select
        id={id}
        name={name}
        className={`${className} mt-2`}
        value={selected}
        onChange={(e) => onChange(e.target.value)}
      >
        {UPEER_MARKETS.map((market) => (
          <option key={market.currency} value={market.currency}>
            {formatMarketLabel(market)}
          </option>
        ))}
      </select>
    </div>
  );
}
