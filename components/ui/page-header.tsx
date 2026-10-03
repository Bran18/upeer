type PageHeaderProps = {
  eyebrow?: string;
  title: string;
  description?: string;
  titleId?: string;
};

export function PageHeader({
  eyebrow,
  title,
  description,
  titleId,
}: PageHeaderProps) {
  return (
    <header className="mb-10 max-w-2xl sm:mb-12">
      {eyebrow ? (
        <p className="text-[0.6875rem] font-medium uppercase tracking-[0.28em] text-[var(--foreground-tertiary)]">
          {eyebrow}
        </p>
      ) : null}
      <h1
        id={titleId}
        className="mt-4 text-[clamp(2.25rem,6vw,4.5rem)] font-medium leading-[0.92] tracking-[-0.045em] text-balance"
      >
        {title}
      </h1>
      {description ? (
        <p className="mt-5 max-w-md text-[1.0625rem] leading-relaxed text-[var(--foreground-secondary)] text-pretty">
          {description}
        </p>
      ) : null}
    </header>
  );
}
