'use client';

import type { PlatformIntent } from '@/lib/profile/types';

export type RoleOptionConfig = {
  intent: PlatformIntent;
  title: string;
  description: string;
  bullets: string[];
};

type RoleOptionProps = {
  config: RoleOptionConfig;
  selected: boolean;
  onSelect: () => void;
};

export function RoleOption({ config, selected, onSelect }: RoleOptionProps) {
  return (
    <button
      type="button"
      role="radio"
      aria-checked={selected}
      onClick={onSelect}
      className={`w-full rounded-[var(--radius-card)] border p-5 text-left transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent)] ${
        selected
          ? 'border-[var(--accent)] bg-[var(--accent-muted)] shadow-[var(--shadow-elevated)]'
          : 'surface-card border-[var(--line)] hover:shadow-[var(--shadow-elevated)]'
      }`}
    >
      <span className="text-headline">{config.title}</span>
      <p className="text-body mt-1 text-[0.9375rem]">{config.description}</p>
      <ul className="text-body mt-3 list-disc space-y-1 pl-5 text-[0.875rem]">
        {config.bullets.map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ul>
    </button>
  );
}
