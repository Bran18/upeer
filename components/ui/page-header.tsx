type PageHeaderProps = {
  eyebrow?: string;
  title: string;
  description?: string;
};

export function PageHeader({ eyebrow, title, description }: PageHeaderProps) {
  return (
    <header className="mb-12 max-w-2xl">
      {eyebrow ? (
        <p className="text-caption font-medium uppercase tracking-[0.22em]">
          {eyebrow}
        </p>
      ) : null}
      <h1 className="text-title-2 mt-3 text-balance">{title}</h1>
      {description ? (
        <p className="text-body mt-4 text-pretty">{description}</p>
      ) : null}
    </header>
  );
}
