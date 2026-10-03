'use client';

import type { OrderRoleFilter } from '@/lib/orders/filters';
import { cn } from '@/lib/cn';

type Props = {
  role: OrderRoleFilter;
  resultCount: number;
  activeCount: number;
  onChange: (role: OrderRoleFilter) => void;
};

const ROLE_OPTIONS: { id: OrderRoleFilter; label: string }[] = [
  { id: 'all', label: 'All Orders' },
  { id: 'incoming', label: 'Incoming' },
  { id: 'outgoing', label: 'Outgoing' },
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

function moveSelection(
  current: OrderRoleFilter,
  delta: number,
): OrderRoleFilter {
  const index = ROLE_OPTIONS.findIndex((option) => option.id === current);
  const next = (index + delta + ROLE_OPTIONS.length) % ROLE_OPTIONS.length;
  return ROLE_OPTIONS[next].id;
}

export function OrdersToolbar({
  role,
  resultCount,
  activeCount,
  onChange,
}: Props) {
  const handleKeyDown = (event: React.KeyboardEvent<HTMLButtonElement>) => {
    if (event.key === 'ArrowRight' || event.key === 'ArrowDown') {
      event.preventDefault();
      onChange(moveSelection(role, 1));
      return;
    }
    if (event.key === 'ArrowLeft' || event.key === 'ArrowUp') {
      event.preventDefault();
      onChange(moveSelection(role, -1));
    }
  };

  return (
    <div className="sticky top-[var(--site-header-height)] z-30 -mx-[var(--frame-inline-start)] border-b border-[var(--line)] bg-[color-mix(in_srgb,var(--background)_92%,transparent)] px-[var(--frame-inline-start)] py-3 backdrop-blur-md sm:-mx-0 sm:rounded-[var(--radius-ui)] sm:border sm:px-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <p className="text-sm font-medium tabular-nums" aria-live="polite">
            {resultCount} order{resultCount === 1 ? '' : 's'}
            {resultCount > 0
              ? ` · ${activeCount} active`
              : ''}
          </p>
          <p className="text-xs text-[var(--foreground-tertiary)]">
            Incoming are takes on your desk. Outgoing are trades you requested.
          </p>
        </div>
        <div
          className="flex gap-1 overflow-x-auto overscroll-x-contain pb-1 scrollbar-none"
          role="radiogroup"
          aria-label="Order direction"
        >
          {ROLE_OPTIONS.map((option) => (
            <FilterChip
              key={option.id}
              active={role === option.id}
              label={option.label}
              tabIndex={role === option.id ? 0 : -1}
              onClick={() => onChange(option.id)}
              onKeyDown={handleKeyDown}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
