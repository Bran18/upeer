'use client';

import { cn } from '@/lib/cn';
import type { PostOrderSide } from '@/lib/orders/post-order-types';

export type { PostOrderSide };

const OPTIONS: { value: PostOrderSide; title: string; description: string }[] = [
  {
    value: 'sell_usdc',
    title: 'I sell USDC',
    description: 'You receive fiat; USDC locks in escrow when a trade starts.',
  },
  {
    value: 'buy_usdc',
    title: 'I buy USDC',
    description: 'You send fiat; counterparty supplies USDC to escrow.',
  },
];

type Props = {
  value: PostOrderSide;
  onChange: (side: PostOrderSide) => void;
  compact?: boolean;
};

export function PostOrderSidePills({ value, onChange, compact = false }: Props) {
  return (
    <div
      className="grid gap-2 sm:grid-cols-2"
      role="radiogroup"
      aria-label="Order side"
    >
      {OPTIONS.map((option) => {
        const selected = value === option.value;
        return (
          <button
            key={option.value}
            type="button"
            role="radio"
            aria-checked={selected}
            onClick={() => onChange(option.value)}
            className={cn(
              'rounded-[var(--radius-ui)] border px-3 py-2.5 text-left transition-colors touch-manipulation sm:px-4 sm:py-3',
              'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent)]',
              selected
                ? 'border-[var(--accent)] bg-[color-mix(in_srgb,var(--accent)_12%,transparent)]'
                : 'border-[var(--line)] bg-[var(--surface)] hover:border-[var(--foreground-tertiary)]',
            )}
          >
            <span className="block text-sm font-medium text-[var(--foreground)]">
              {option.title}
            </span>
            {compact ? null : (
              <span className="mt-1 block text-xs leading-relaxed text-[var(--foreground-secondary)] text-pretty">
                {option.description}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
