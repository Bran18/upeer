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
      className="site-header-bar flex w-full"
      role="radiogroup"
      aria-label="How you use upeer"
    >
      {ONBOARDING_ROLE_OPTIONS.map((option) => {
        const selected = value === option.intent;
        return (
          <button
            key={option.intent}
            type="button"
            role="radio"
            aria-checked={selected}
            className={cn('nav-pill flex-1 justify-center', selected && 'nav-pill--active')}
            onClick={() => onChange(option.intent)}
          >
            {option.tag}
          </button>
        );
      })}
    </div>
  );
}
