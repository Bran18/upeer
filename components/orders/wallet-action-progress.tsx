type Props = {
  headline: string;
  detail: string;
  walletHint?: boolean;
};

export function WalletActionProgress({
  headline,
  detail,
  walletHint = false,
}: Props) {
  return (
    <div
      className="mx-auto w-full max-w-sm rounded-xl border border-[var(--border)] bg-[var(--background)] px-4 py-4 shadow-lg"
      role="status"
      aria-live="polite"
      aria-busy="true"
    >
      <div className="flex gap-3">
        <span
          className="mt-0.5 inline-block size-4 shrink-0 animate-spin rounded-full border-2 border-[var(--foreground-tertiary)] border-t-[var(--accent)]"
          aria-hidden
        />
        <div className="min-w-0">
          <p className="text-sm font-semibold tracking-tight">{headline}</p>
          <p className="mt-1 text-sm text-[var(--foreground-secondary)] text-pretty">
            {detail}
          </p>
          {walletHint ? (
            <p className="mt-2 text-xs text-[var(--foreground-tertiary)] text-pretty">
              Complete any Pollar wallet prompts. Keep this tab open until this
              finishes — do not refresh or leave the page.
            </p>
          ) : (
            <p className="mt-2 text-xs text-[var(--foreground-tertiary)] text-pretty">
              Please wait until this step completes.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
