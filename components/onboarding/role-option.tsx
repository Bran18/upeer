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
      className={`w-full rounded-xl border p-5 text-left transition-[border-color,box-shadow,background-color] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-600 ${
        selected
          ? 'border-emerald-600 bg-emerald-50/80 shadow-sm dark:border-emerald-500 dark:bg-emerald-950/40'
          : 'border-zinc-200 bg-white hover:border-zinc-300 dark:border-zinc-700 dark:bg-zinc-900 dark:hover:border-zinc-600'
      }`}
    >
      <span className="text-base font-semibold text-zinc-900 dark:text-zinc-50">
        {config.title}
      </span>
      <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
        {config.description}
      </p>
      <ul className="mt-3 list-disc space-y-1 pl-5 text-sm text-zinc-600 dark:text-zinc-400">
        {config.bullets.map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ul>
    </button>
  );
}
