'use client';

import { ONBOARDING_ROLE_OPTIONS } from '@/lib/onboarding/role-options';
import type { PlatformIntent } from '@/lib/profile/types';
import { cn } from '@/lib/cn';

type RolePillsProps = {
  value: PlatformIntent | null;
  onChange: (intent: PlatformIntent) => void;
};

export function RolePills({ value, onChange }: RolePillsProps) {
  return (
    <div
      className="grid grid-cols-1 gap-3 sm:grid-cols-3"
      role="radiogroup"
      aria-label="Marketplace role"
    >
      {ONBOARDING_ROLE_OPTIONS.map((option) => {
        const selected = value === option.intent;
        return (
          <button
            key={option.intent}
            type="button"
            role="radio"
            aria-checked={selected}
            onClick={() => onChange(option.intent)}
            className={cn(
              'relative rounded-[var(--radius-ui)] border px-3 py-3 text-left transition-[border-color,background-color,box-shadow] touch-manipulation sm:px-4',
              'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent)]',
              selected
                ? 'border-[var(--accent)] bg-[color-mix(in_srgb,var(--accent)_16%,transparent)] shadow-[inset_0_0_0_1px_color-mix(in_srgb,var(--accent)_35%,transparent)]'
                : 'border-[var(--line)] bg-[var(--surface)] hover:border-[var(--foreground-tertiary)]',
            )}
          >
            {selected ? (
              <span
                className="absolute right-2.5 top-2.5 flex h-5 w-5 items-center justify-center rounded-full bg-[var(--accent)] text-[0.65rem] font-bold text-[var(--accent-ink)]"
                aria-hidden
              >
                ✓
              </span>
            ) : null}
            <span
              className={cn(
                'block text-sm font-medium pr-6',
                selected
                  ? 'text-[var(--foreground)]'
                  : 'text-[var(--foreground-secondary)]',
              )}
            >
              {option.title}
            </span>
            <span
              className={cn(
                'mt-1 block text-xs leading-snug text-pretty',
                selected
                  ? 'text-[var(--foreground-secondary)]'
                  : 'text-[var(--foreground-tertiary)]',
              )}
            >
              {option.tag}
            </span>
          </button>
        );
      })}
    </div>
  );
}
