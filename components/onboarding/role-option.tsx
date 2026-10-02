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
      className={`w-full rounded-2xl border p-5 text-left transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent)] ${
        selected
          ? 'border-[var(--accent)]/60 bg-[var(--accent)]/10 shadow-[0_0_40px_-20px_var(--accent-glow)]'
          : 'glass-panel hover:border-white/15'
      }`}
    >
      <span className="font-[family-name:var(--font-display)] text-lg font-semibold">
        {config.title}
      </span>
      <p className="mt-1 text-sm text-[var(--muted)]">
        {config.description}
      </p>
      <ul className="mt-3 list-disc space-y-1 pl-5 text-sm text-[var(--muted)]">
        {config.bullets.map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ul>
    </button>
  );
}
