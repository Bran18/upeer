'use client';

import { useId } from 'react';
import { formatFiatBadge } from '@/lib/fiat/coverage';
import type {
  MarketFilters,
  MarketSideFilter,
  MarketSort,
} from '@/lib/market/filters';
import { cn } from '@/lib/cn';

type Props = {
  filters: MarketFilters;
  fiatOptions: string[];
  resultCount: number;
  totalCount: number;
  onChange: (next: Partial<MarketFilters>) => void;
};

const SIDE_OPTIONS: { id: MarketSideFilter; label: string }[] = [
  { id: 'all', label: 'All Offers' },
  { id: 'sell_usdc', label: 'Buy USDC' },
  { id: 'buy_usdc', label: 'Sell USDC' },
];

const SORT_OPTIONS: { id: MarketSort; label: string }[] = [
  { id: 'price', label: 'Best Price' },
  { id: 'liquidity', label: 'Most Size' },
  { id: 'name', label: 'Name A–Z' },
];

function FilterChip({
  active,
  label,
  tabIndex,
  onClick,
  onKeyDown,
}: {
  active: boolean;
  label: string;
  tabIndex: number;
  onClick: () => void;
  onKeyDown: (event: React.KeyboardEvent<HTMLButtonElement>) => void;
}) {
  return (
    <button
      type="button"
      role="radio"
      aria-checked={active}
      tabIndex={tabIndex}
      onClick={onClick}
      onKeyDown={onKeyDown}
      className={cn(
        'nav-pill min-h-9 shrink-0 px-3 text-[var(--foreground-secondary)] touch-manipulation',
        'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent)]',
        active && 'nav-pill--active',
      )}
    >
      {label}
    </button>
  );
}

function moveSelection<T extends string>(
  options: readonly { id: T }[],
  current: T,
  delta: number,
): T {
  const index = options.findIndex((option) => option.id === current);
  const next = (index + delta + options.length) % options.length;
  return options[next].id;
}

export function MarketToolbar({
  filters,
  fiatOptions,
  resultCount,
  totalCount,
  onChange,
}: Props) {
  const fiatId = useId();
  const sortId = useId();

  const handleSideKeyDown = (
    event: React.KeyboardEvent<HTMLButtonElement>,
  ) => {
    if (event.key === 'ArrowRight' || event.key === 'ArrowDown') {
      event.preventDefault();
      onChange({ side: moveSelection(SIDE_OPTIONS, filters.side, 1) });
      return;
    }
    if (event.key === 'ArrowLeft' || event.key === 'ArrowUp') {
      event.preventDefault();
      onChange({ side: moveSelection(SIDE_OPTIONS, filters.side, -1) });
    }
  };

  const countLabel =
    resultCount !== totalCount
      ? `${resultCount} of ${totalCount} offers`
      : `${resultCount} offer${resultCount === 1 ? '' : 's'}`;

  return (
    <div
      className="sticky top-[var(--site-header-height)] z-30 -mx-[var(--frame-inline-start)] border-b border-[var(--line)] bg-[color-mix(in_srgb,var(--background)_92%,transparent)] px-[var(--frame-inline-start)] py-3 backdrop-blur-md sm:-mx-0 sm:rounded-[var(--radius-ui)] sm:border sm:px-4"
    >
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="min-w-0">
          <p className="text-sm font-medium tabular-nums" aria-live="polite">
            {countLabel}
          </p>
          <p className="text-xs text-[var(--foreground-tertiary)]">
            Filters stay in the URL so you can share this view.
          </p>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
          <div
            className="flex gap-1 overflow-x-auto overscroll-x-contain pb-1 scrollbar-none"
            role="radiogroup"
            aria-label="Trade side"
          >
            {SIDE_OPTIONS.map((option) => (
              <FilterChip
                key={option.id}
                active={filters.side === option.id}
                label={option.label}
                tabIndex={filters.side === option.id ? 0 : -1}
                onClick={() => onChange({ side: option.id })}
                onKeyDown={handleSideKeyDown}
              />
            ))}
          </div>

          {fiatOptions.length > 1 ? (
            <div className="flex min-w-0 items-center gap-2 text-sm">
              <label
                htmlFor={fiatId}
                className="shrink-0 text-[var(--foreground-tertiary)]"
              >
                Market
              </label>
              <select
                id={fiatId}
                name="fiat"
                autoComplete="off"
                value={filters.fiat}
                onChange={(event) => onChange({ fiat: event.target.value })}
                className="field-input !mt-0 min-h-9 w-auto min-w-[8rem] py-1.5 text-sm"
              >
                <option value="all">All markets</option>
                {fiatOptions.map((fiat) => (
                  <option key={fiat} value={fiat}>
                    {formatFiatBadge(fiat)}
                  </option>
                ))}
              </select>
            </div>
          ) : null}

          <div className="flex min-w-0 items-center gap-2 text-sm">
            <label
              htmlFor={sortId}
              className="shrink-0 text-[var(--foreground-tertiary)]"
            >
              Sort
            </label>
            <select
              id={sortId}
              name="sort"
              autoComplete="off"
              value={filters.sort}
              onChange={(event) =>
                onChange({ sort: event.target.value as MarketSort })
              }
              className="field-input !mt-0 min-h-9 w-auto min-w-[9rem] py-1.5 text-sm"
            >
              {SORT_OPTIONS.map((option) => (
                <option key={option.id} value={option.id}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>
    </div>
  );
}
