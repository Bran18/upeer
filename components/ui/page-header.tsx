type PageHeaderProps = {
  eyebrow?: string;
  title: string;
  description?: string;
};

export function PageHeader({ eyebrow, title, description }: PageHeaderProps) {
  return (
    <header className="mb-10 max-w-2xl">
      {eyebrow ? (
        <p className="font-mono text-xs uppercase tracking-[0.2em] text-[var(--muted)]">
          {eyebrow}
        </p>
      ) : null}
      <h1 className="mt-3 font-[family-name:var(--font-display)] text-3xl font-bold tracking-tight text-balance sm:text-4xl">
        {title}
      </h1>
      {description ? (
        <p className="mt-4 text-pretty text-base leading-relaxed text-[var(--muted)]">
          {description}
        </p>
      ) : null}
    </header>
  );
}
