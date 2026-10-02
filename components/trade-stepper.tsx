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
    <ol className="flex flex-wrap gap-2 text-sm">
      {STEPS.map((label, index) => {
        const active = index === activeStep;
        const done = index < activeStep;
        return (
          <li
            key={label}
            className={`rounded-full px-3 py-1 font-medium ${
              active
                ? 'bg-emerald-600 text-white'
                : done
                  ? 'bg-emerald-100 text-emerald-900 dark:bg-emerald-900/40 dark:text-emerald-100'
                  : 'bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400'
            }`}
          >
            {index + 1}. {label}
          </li>
        );
      })}
    </ol>
  );
}
