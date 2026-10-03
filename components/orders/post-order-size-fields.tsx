'use client';

import { useMemo } from 'react';
import { cn } from '@/lib/cn';
import { formatUsdcAmount } from '@/lib/market/format';
import { postOrderSizeFieldError } from '@/lib/orders/post-order-validation';
import type { PostOrderSizeValues } from '@/lib/orders/post-order-types';

const LISTING_PRESETS = ['250', '500', '1000', '5000'] as const;
const MIN_TRADE_PRESETS = ['25', '50', '100', '250'] as const;

function choicePillClass(active: boolean, size: 'sm' | 'md' = 'md') {
  return cn(
    'inline-flex items-center justify-center rounded-[var(--radius-pill,9999px)] border font-medium tabular-nums transition-colors touch-manipulation',
    'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent)]',
    size === 'sm' ? 'min-h-8 px-2.5 text-xs' : 'min-h-9 px-3 text-sm',
    active
      ? 'border-[var(--accent)] bg-[color-mix(in_srgb,var(--accent)_16%,var(--surface))] text-[var(--foreground)] ring-1 ring-[color-mix(in_srgb,var(--accent)_35%,transparent)]'
      : 'border-[var(--line)] bg-[var(--surface)] text-[var(--foreground-secondary)] hover:border-[var(--foreground-tertiary)] hover:text-[var(--foreground)]',
  );
}

export type { PostOrderSizeValues };

type Props = {
  values: PostOrderSizeValues;
  onChange: (patch: Partial<PostOrderSizeValues>) => void;
};

function parsePositive(value: string): number | null {
  const n = Number(value);
  if (!Number.isFinite(n) || n <= 0) {
    return null;
  }
  return n;
}

export function describePostOrderSize(values: PostOrderSizeValues): string | null {
  const available = parsePositive(values.availableUsdc);
  const min = parsePositive(values.minUsdc);
  const max = parsePositive(values.maxUsdc);
  if (available === null || min === null || max === null) {
    return null;
  }
  if (min > max || max > available) {
    return null;
  }
  const listed = formatUsdcAmount(values.availableUsdc);
  const minLabel = formatUsdcAmount(values.minUsdc);
  const maxLabel = formatUsdcAmount(values.maxUsdc);
  if (min === max && min === available) {
    return `One trade only: ${listed} USDC total.`;
  }
  if (max === available && min < available) {
    return `${listed} USDC listed. Each trade can be ${minLabel}–${maxLabel} USDC (up to your full listing).`;
  }
  return `${listed} USDC listed. Each trade must be between ${minLabel} and ${maxLabel} USDC.`;
}

export function PostOrderSizeFields({ values, onChange }: Props) {
  const { availableUsdc, minUsdc, maxUsdc } = values;

  const summary = useMemo(() => describePostOrderSize(values), [values]);
  const fieldError = useMemo(() => postOrderSizeFieldError(values), [values]);

  const setListingTotal = (next: string) => {
    const patch: Partial<PostOrderSizeValues> = { availableUsdc: next };
    const available = parsePositive(next);
    const max = parsePositive(maxUsdc);
    if (available !== null && max !== null && max > available) {
      patch.maxUsdc = next;
    }
    onChange(patch);
  };

  const useFullListingPerTrade = () => {
    onChange({
      maxUsdc: availableUsdc,
    });
  };

  const oneTradeOnly = () => {
    onChange({
      minUsdc: availableUsdc,
      maxUsdc: availableUsdc,
    });
  };

  const maxEqualsAvailable =
    parsePositive(availableUsdc) !== null &&
    parsePositive(maxUsdc) === parsePositive(availableUsdc);

  const isOneTradeOnly =
    parsePositive(availableUsdc) !== null &&
    parsePositive(minUsdc) === parsePositive(availableUsdc) &&
    parsePositive(maxUsdc) === parsePositive(availableUsdc);

  return (
    <div className="space-y-5">
      <div>
        <label className="field-label" htmlFor="post-available">
          Total USDC on this listing
        </label>
        <p className="mt-1 text-xs leading-relaxed text-[var(--foreground-tertiary)] text-pretty">
          The full amount you are offering across all trades until this order is filled or you
          cancel it.
        </p>
        <div className="mt-2 flex flex-wrap gap-2">
          {LISTING_PRESETS.map((preset) => (
            <button
              key={preset}
              type="button"
              onClick={() => setListingTotal(preset)}
              className={choicePillClass(availableUsdc === preset)}
            >
              {formatUsdcAmount(preset)}
            </button>
          ))}
        </div>
        <input
          id="post-available"
          name="availableUsdc"
          type="text"
          inputMode="decimal"
          autoComplete="off"
          spellCheck={false}
          className="field-input tabular-nums mt-3"
          value={availableUsdc}
          onChange={(e) => setListingTotal(e.target.value)}
          placeholder="e.g. 1000"
          aria-invalid={fieldError?.includes('listing') ?? false}
        />
      </div>

      <div className="rounded-[var(--radius-ui)] border border-[var(--line)] bg-[var(--fill)] px-4 py-3 space-y-4">
        <div>
          <p className="text-sm font-medium text-[var(--foreground)]">Per trade</p>
          <p className="mt-1 text-xs leading-relaxed text-[var(--foreground-tertiary)] text-pretty">
            Limits for a single request from a counterparty. Both must stay at or below your
            listing total.
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={useFullListingPerTrade}
              className={choicePillClass(maxEqualsAvailable && !isOneTradeOnly)}
            >
              Up to full listing
            </button>
            <button
              type="button"
              onClick={oneTradeOnly}
              className={choicePillClass(isOneTradeOnly)}
            >
              One trade only
            </button>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="field-label" htmlFor="post-min">
              Smallest trade
            </label>
            <p className="mt-1 text-xs text-[var(--foreground-tertiary)]">USDC</p>
            <div className="mt-2 flex flex-wrap gap-1.5">
              {MIN_TRADE_PRESETS.map((preset) => (
                <button
                  key={preset}
                  type="button"
                  onClick={() => onChange({ minUsdc: preset })}
                  className={choicePillClass(minUsdc === preset, 'sm')}
                >
                  {preset}
                </button>
              ))}
            </div>
            <input
              id="post-min"
              name="minUsdc"
              type="text"
              inputMode="decimal"
              autoComplete="off"
              spellCheck={false}
              className="field-input tabular-nums mt-2 w-full"
              value={minUsdc}
              onChange={(e) => onChange({ minUsdc: e.target.value })}
              placeholder="e.g. 50"
            />
          </div>
          <div>
            <label className="field-label" htmlFor="post-max">
              Largest trade
            </label>
            <p className="mt-1 text-xs text-[var(--foreground-tertiary)]">
              USDC · max {formatUsdcAmount(availableUsdc)}
            </p>
            <input
              id="post-max"
              name="maxUsdc"
              type="text"
              inputMode="decimal"
              autoComplete="off"
              spellCheck={false}
              className="field-input tabular-nums mt-2 w-full"
              value={maxUsdc}
              onChange={(e) => onChange({ maxUsdc: e.target.value })}
              placeholder="e.g. 500"
            />
          </div>
        </div>
      </div>

      {fieldError ? (
        <p className="text-xs text-amber-700 dark:text-amber-300" role="status">
          {fieldError}
        </p>
      ) : summary ? (
        <p className="text-sm text-[var(--foreground-secondary)] text-pretty" role="status">
          {summary}
        </p>
      ) : null}
    </div>
  );
}
