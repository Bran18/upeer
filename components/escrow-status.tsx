type Props = {
  state: string;
  contractId?: string | null;
};

export function EscrowStatus({ state, contractId }: Props) {
  return (
    <div className="panel-card">
      <p className="text-sm text-subtle">Trustless Work Escrow</p>
      <p className="mt-1 font-medium capitalize">{state.replaceAll('_', ' ')}</p>
      {contractId ? (
        <p
          className="mt-2 truncate font-mono text-xs text-muted"
          translate="no"
          title={contractId}
        >
          {contractId}
        </p>
      ) : null}
    </div>
  );
}
