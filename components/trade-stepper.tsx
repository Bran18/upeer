const STEPS = [
  'Quote',
  'Reserve',
  'Fund escrow',
  'Fiat pending',
  'Release',
] as const;

export type TradeStep = (typeof STEPS)[number];

type Props = {
  activeStep: number;
};

export function TradeStepper({ activeStep }: Props) {
  return (
    <div className="-mx-1 overflow-x-auto pb-1 scrollbar-none">
      <ol className="flex min-w-min gap-2 px-1 snap-x snap-mandatory">
        {STEPS.map((label, index) => {
          const active = index === activeStep;
          const done = index < activeStep;
          return (
            <li
              key={label}
              className={`shrink-0 snap-start rounded-full px-3 py-1.5 text-xs font-medium transition sm:px-3.5 sm:text-sm ${
                active
                  ? 'step-pill-active bg-[var(--accent)] text-[var(--accent-ink)] shadow-[0_0_24px_-4px_rgba(10,132,255,0.55)]'
                  : done
                    ? 'bg-[var(--accent-muted)] text-[var(--accent)]'
                    : 'bg-[var(--fill)] text-[var(--foreground-secondary)]'
              }`}
            >
              <span className="whitespace-nowrap">
                {index + 1}. {label}
              </span>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
