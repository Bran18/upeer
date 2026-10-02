type Props = {
  code: string;
  issuer: string;
  ratingAverage?: number;
};

export function AssetBadge({ code, issuer, ratingAverage }: Props) {
  return (
    <span
      className="inline-flex items-center gap-2 rounded-md bg-zinc-100 px-2 py-1 text-xs font-medium dark:bg-zinc-800"
      title={issuer}
    >
      {code}
      {ratingAverage !== undefined ? (
        <span className="rounded bg-emerald-600/15 px-1.5 py-0.5 text-emerald-800 dark:text-emerald-200">
          SE {ratingAverage.toFixed(1)}
        </span>
      ) : null}
    </span>
  );
}
