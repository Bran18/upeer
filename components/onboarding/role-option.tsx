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
  showDestination?: boolean;
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
        'flex w-full gap-4 rounded-[var(--radius-ui)] border p-4 text-left transition-[border-color,background-color,box-shadow] duration-200 touch-manipulation sm:p-5',
        'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent)]',
        selected
          ? 'border-[var(--accent)] bg-[var(--accent-muted)] shadow-[0_0_0_1px_var(--accent)]'
          : 'border-[var(--line)] bg-[var(--surface)] hover:border-[var(--foreground-tertiary)] hover:bg-[var(--fill)]',
      )}
    >
      <span
        aria-hidden="true"
        className={cn(
          'mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2',
          selected ? 'border-[var(--accent)]' : 'border-[var(--foreground-tertiary)]',
        )}
      >
        <span
          className={cn(
            'h-2.5 w-2.5 rounded-full bg-[var(--accent)] transition-opacity duration-150',
            selected ? 'opacity-100' : 'opacity-0',
          )}
        />
      </span>
      <span className="min-w-0 flex-1">
        <span className="flex flex-wrap items-center gap-2">
          <span className="text-base font-semibold tracking-tight text-balance">
            {config.title}
          </span>
          <span className="rounded-full bg-[var(--fill)] px-2 py-0.5 text-[0.625rem] font-medium uppercase tracking-[0.14em] text-[var(--foreground-tertiary)]">
            {config.tag}
          </span>
        </span>
        <p className="mt-1.5 text-sm leading-relaxed text-[var(--foreground-secondary)] text-pretty">
          {config.description}
        </p>
        <ul className="mt-3 space-y-1.5 text-sm text-[var(--foreground-secondary)]">
          {config.bullets.map((item) => (
            <li key={item} className="flex gap-2 text-pretty">
              <span className="text-[var(--accent)]" aria-hidden="true">·</span>
              <span>{item}</span>
            </li>
          ))}
        </ul>
      </span>
    </button>
  );
});
