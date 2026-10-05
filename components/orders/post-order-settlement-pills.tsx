'use client';

import {
  listSelectableSettlementAssets,
  type SettlementAsset,
} from '@/lib/settlement/assets';
import { cn } from '@/lib/cn';

type Props = {
  value: SettlementAsset;
  onChange: (asset: SettlementAsset) => void;
};

export function PostOrderSettlementPills({ value, onChange }: Props) {
  const options = listSelectableSettlementAssets();

  return (
    <div
      className="flex flex-wrap gap-2"
      role="radiogroup"
      aria-label="Settlement asset"
    >
      {options.map((opt) => {
        const active = opt.code === value;
        return (
          <button
            key={opt.code}
            type="button"
            role="radio"
            aria-checked={active}
            onClick={() => onChange(opt.code)}
            className={cn(
              'filter-pill nav-pill min-h-9 px-3 touch-manipulation',
              active && 'filter-pill--active',
            )}
          >
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}
