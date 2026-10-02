type Props = {
  state: string;
  contractId?: string | null;
};

export function EscrowStatus({ state, contractId }: Props) {
  return (
    <div className="glass-panel p-4">
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
