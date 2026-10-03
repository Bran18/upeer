import type { ReactNode } from 'react';

type ScreenHeaderProps = {
  title: string;
  description?: string;
  titleId?: string;
  action?: ReactNode;
};

export function ScreenHeader({
  title,
  description,
  titleId,
  action,
}: ScreenHeaderProps) {
  return (
    <header className="mb-8 flex max-w-2xl flex-col gap-4 sm:mb-10 sm:flex-row sm:items-end sm:justify-between">
      <div className="min-w-0 max-w-md">
        <h1
          id={titleId}
          className="text-[clamp(1.85rem,5vw,2.5rem)] font-medium tracking-[-0.04em] text-balance"
        >
          {title}
        </h1>
        {description ? (
          <p className="mt-3 text-sm leading-relaxed text-[var(--foreground-secondary)] text-pretty">
            {description}
          </p>
        ) : null}
      </div>
      {action ? <div className="shrink-0">{action}</div> : null}
    </header>
  );
}
