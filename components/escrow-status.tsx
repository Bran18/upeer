type Props = {
  state: string;
  contractId?: string | null;
};

export function EscrowStatus({ state, contractId }: Props) {
  return (
    <div className="rounded-xl border border-zinc-200 bg-zinc-50 p-4 dark:border-zinc-800 dark:bg-zinc-900/50">
      <p className="text-sm text-zinc-500">Trustless Work escrow</p>
      <p className="mt-1 font-medium capitalize">{state.replaceAll('_', ' ')}</p>
      {contractId ? (
        <p className="mt-2 truncate font-mono text-xs text-zinc-500">
          {contractId}
        </p>
      ) : null}
    </div>
  );
}
