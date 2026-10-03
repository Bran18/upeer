'use client';

import { memo } from 'react';
import { cn } from '@/lib/cn';
import type { RoleOptionConfig } from '@/lib/onboarding/role-options';

type RoleOptionProps = {
  config: RoleOptionConfig;
  selected: boolean;
  tabIndex: number;
  onSelect: () => void;
  onKeyDown: (event: React.KeyboardEvent<HTMLButtonElement>) => void;
};

export const RoleOption = memo(function RoleOption({
  config,
  selected,
  tabIndex,
  onSelect,
  onKeyDown,
}: RoleOptionProps) {
  return (
    <button
      type="button"
      role="radio"
      aria-checked={selected}
      tabIndex={tabIndex}
      onClick={onSelect}
      onKeyDown={onKeyDown}
      className={cn(
        'flex w-full min-h-[7.5rem] flex-col rounded-[var(--radius-ui)] border p-4 text-left transition-[border-color,background-color,box-shadow,transform] duration-200 touch-manipulation sm:p-5',
        'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent)]',
        selected
          ? 'border-[var(--accent)] bg-[color-mix(in_srgb,var(--accent)_14%,var(--surface))] shadow-[0_0_0_1px_var(--accent)]'
          : 'border-[var(--line)] bg-[var(--surface)] hover:border-[var(--foreground-tertiary)] hover:bg-[var(--fill)]',
      )}
    >
      <span className="flex items-start justify-between gap-2">
        <span
          aria-hidden="true"
          className={cn(
            'flex h-9 w-9 shrink-0 items-center justify-center rounded-[0.65rem] text-sm font-semibold',
            selected
              ? 'bg-[var(--accent)] text-[var(--accent-ink)]'
              : 'bg-[var(--fill)] text-[var(--foreground-secondary)]',
          )}
        >
          {config.glyph}
        </span>
        <span
          aria-hidden="true"
          className={cn(
            'mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full border-2',
            selected ? 'border-[var(--accent)]' : 'border-[var(--line)]',
          )}
        >
          <span
            className={cn(
              'h-2 w-2 rounded-full bg-[var(--accent)] transition-opacity duration-150',
              selected ? 'opacity-100' : 'opacity-0',
            )}
          />
        </span>
      </span>
      <span className="mt-4 text-sm font-semibold tracking-tight text-balance">
        {config.title}
      </span>
      <span className="mt-1.5 text-xs leading-relaxed text-[var(--foreground-secondary)] text-pretty">
        {config.description}
      </span>
    </button>
  );
});
