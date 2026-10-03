'use client';

import type { MarketFilters, MarketSort, MarketSideFilter } from '@/lib/market/filters';
import { cn } from '@/lib/cn';

type Props = {
  filters: MarketFilters;
  fiatOptions: string[];
  resultCount: number;
  totalCount: number;
  onChange: (next: Partial<MarketFilters>) => void;
};

function FilterChip({
  active,
  label,
  onClick,
}: {
  active: boolean;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'nav-pill min-h-9 shrink-0 px-3 text-[var(--foreground-secondary)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent)]',
        active && 'nav-pill--active',
      )}
    >
      {label}
    </button>
  );
}

export function MarketToolbar({
  filters,
  fiatOptions,
  resultCount,
  totalCount,
  onChange,
}: Props) {
  const sideOptions: { id: MarketSideFilter; label: string }[] = [
    { id: 'all', label: 'All orders' },
    { id: 'sell_usdc', label: 'Buy USDC' },
    { id: 'buy_usdc', label: 'Sell USDC' },
  ];

  const sortOptions: { id: MarketSort; label: string }[] = [
    { id: 'price', label: 'Best price' },
    { id: 'liquidity', label: 'Most size' },
    { id: 'name', label: 'Seller A–Z' },
  ];

  return (
    <div
      className="sticky top-[var(--site-header-height)] z-30 -mx-[var(--frame-inline-start)] border-b border-[var(--line)] bg-[color-mix(in_srgb,var(--background)_92%,transparent)] px-[var(--frame-inline-start)] py-3 backdrop-blur-md sm:-mx-0 sm:rounded-[var(--radius-ui)] sm:border sm:px-4"
    >
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="min-w-0">
          <p className="text-sm font-medium">
            {resultCount} offer{resultCount === 1 ? '' : 's'}
            {resultCount !== totalCount ? ` of ${totalCount}` : ''}
          </p>
          <p className="text-xs text-[var(--foreground-tertiary)]">
            Filters update the URL so you can share a view.
          </p>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
          <div
            className="flex gap-1 overflow-x-auto pb-1 scrollbar-none"
            role="group"
            aria-label="Trade side"
          >
            {sideOptions.map((option) => (
              <FilterChip
                key={option.id}
                active={filters.side === option.id}
                label={option.label}
                onClick={() => onChange({ side: option.id })}
              />
            ))}
          </div>

          {fiatOptions.length > 1 ? (
            <label className="flex items-center gap-2 text-sm">
              <span className="text-[var(--foreground-tertiary)]">Fiat</span>
              <select
                value={filters.fiat}
                onChange={(e) => onChange({ fiat: e.target.value })}
                className="field-input !mt-0 min-h-9 w-auto min-w-[5.5rem] py-1.5 text-sm"
              >
                <option value="all">All</option>
                {fiatOptions.map((fiat) => (
                  <option key={fiat} value={fiat}>
                    {fiat}
                  </option>
                ))}
              </select>
            </label>
          ) : null}

          <label className="flex items-center gap-2 text-sm">
            <span className="text-[var(--foreground-tertiary)]">Sort</span>
            <select
              value={filters.sort}
              onChange={(e) => onChange({ sort: e.target.value as MarketSort })}
              className="field-input !mt-0 min-h-9 w-auto min-w-[9rem] py-1.5 text-sm"
            >
              {sortOptions.map((option) => (
                <option key={option.id} value={option.id}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>
        </div>
      </div>
    </div>
  );
}
