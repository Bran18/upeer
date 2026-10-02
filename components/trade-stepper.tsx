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
    <ol className="flex flex-wrap gap-2">
      {STEPS.map((label, index) => {
        const active = index === activeStep;
        const done = index < activeStep;
        return (
          <li
            key={label}
            className={`rounded-full px-3.5 py-1.5 text-xs font-medium transition sm:text-sm ${
              active
                ? 'step-pill-active bg-[var(--accent)] text-[var(--accent-ink)] shadow-[0_0_24px_-4px_rgba(10,132,255,0.55)]'
                : done
                  ? 'bg-[var(--accent-muted)] text-[var(--accent)]'
                  : 'bg-[var(--fill)] text-[var(--foreground-secondary)]'
            }`}
          >
            {index + 1}. {label}
          </li>
        );
      })}
    </ol>
  );
}
