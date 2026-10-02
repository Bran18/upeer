type Props = {
  code: string;
  issuer: string;
  ratingAverage?: number;
};

export function AssetBadge({ code, issuer, ratingAverage }: Props) {
  return (
    <span
      className="inline-flex items-center gap-2 rounded-md bg-[var(--fill)] px-2 py-1 text-xs font-medium"
      title={issuer}
    >
      {code}
      {ratingAverage !== undefined ? (
        <span className="rounded bg-[var(--accent-muted)] px-1.5 py-0.5 text-[var(--accent)]">
          SE {ratingAverage.toFixed(1)}
        </span>
      ) : null}
    </span>
  );
}
