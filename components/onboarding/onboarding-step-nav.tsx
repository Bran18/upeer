'use client';

import { cn } from '@/lib/cn';

export type OnboardingStep = 1 | 2;

const STEPS: { id: OnboardingStep; label: string; shortLabel: string }[] = [
  { id: 1, label: 'How you trade', shortLabel: 'Role' },
  { id: 2, label: 'How you appear', shortLabel: 'Name' },
];

type Props = {
  step: OnboardingStep;
};

function stepCircleClass(done: boolean, current: boolean) {
  if (current) {
    return 'border-[var(--accent)] bg-[color-mix(in_srgb,var(--accent)_22%,var(--surface))] text-[var(--foreground)] ring-2 ring-[color-mix(in_srgb,var(--accent)_40%,transparent)]';
  }
  if (done) {
    return 'border-[var(--accent)] bg-[var(--accent)] text-[var(--accent-ink)]';
  }
  return 'border-[color-mix(in_srgb,var(--foreground-secondary)_55%,var(--line))] bg-[var(--fill)] text-[var(--foreground-secondary)]';
}

export function OnboardingStepNav({ step }: Props) {
  const active = STEPS[step - 1];

  return (
    <nav aria-label="Setup progress" className="space-y-3">
      <ol className="flex items-center gap-2">
        {STEPS.map(({ id, label, shortLabel }, index) => {
          const done = id < step;
          const current = id === step;
          return (
            <li key={id} className="flex min-w-0 flex-1 items-center gap-2">
              <div className="flex min-w-0 flex-1 flex-col items-center gap-1.5 sm:flex-row sm:items-center sm:gap-2.5">
                <span
                  className={cn(
                    'flex h-8 w-8 shrink-0 items-center justify-center rounded-full border-2 text-xs font-semibold tabular-nums',
                    stepCircleClass(done, current),
                  )}
                  aria-hidden
                >
                  {done ? '✓' : id}
                </span>
                <span
                  className={cn(
                    'max-w-full truncate text-center text-[0.7rem] font-medium leading-tight sm:text-left sm:text-xs',
                    current
                      ? 'text-[var(--foreground)]'
                      : 'text-[var(--foreground-secondary)]',
                  )}
                >
                  <span className="sm:hidden">{shortLabel}</span>
                  <span className="hidden sm:inline">{label}</span>
                </span>
              </div>
              {index < STEPS.length - 1 ? (
                <div
                  className={cn(
                    'h-0.5 min-w-[1.25rem] flex-1 rounded-full',
                    id < step ? 'bg-[var(--accent)]' : 'bg-[var(--line)]',
                  )}
                  aria-hidden
                />
              ) : null}
            </li>
          );
        })}
      </ol>
      <p className="text-sm text-[var(--foreground-secondary)]">
        <span className="font-medium text-[var(--foreground)]">
          Step {step} of {STEPS.length}
        </span>
        {' · '}
        {active.label}
      </p>
    </nav>
  );
}
