import Link from 'next/link';

type Props = {
  filtered: boolean;
  onResetFilters?: () => void;
};

export function MarketEmpty({ filtered, onResetFilters }: Props) {
  if (filtered) {
    return (
      <div className="ui-card px-6 py-12 text-center">
        <p className="text-base font-medium">No offers match these filters</p>
        <p className="mt-2 text-sm text-[var(--foreground-secondary)] text-pretty">
          Try another country (CRC, ARS, BOB, CLP, COP) or show all desks.
        </p>
        {onResetFilters ? (
          <button
            type="button"
            onClick={onResetFilters}
            className="btn-secondary mt-6"
          >
            Clear filters
          </button>
        ) : null}
      </div>
    );
  }

  return (
    <div className="ui-card px-6 py-12 text-center">
      <p className="text-base font-medium">No live offers yet</p>
      <p className="mt-2 max-w-md mx-auto text-sm text-[var(--foreground-secondary)] text-pretty">
        Merchants publish USDC inventory on testnet after verification. Check
        back soon—or list liquidity from your desk.
      </p>
      <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
        <Link href="/merchant" className="btn-primary">
          Open merchant desk
        </Link>
        <Link href="/onboarding" className="btn-secondary">
          Finish setup
        </Link>
      </div>
    </div>
  );
}
