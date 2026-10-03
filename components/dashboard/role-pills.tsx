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
      className="flex flex-wrap gap-2"
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
              'nav-pill min-h-10 px-4 text-[var(--foreground-secondary)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent)]',
              selected && 'nav-pill--active',
            )}
          >
            {option.title}
          </button>
        );
      })}
    </div>
  );
}
