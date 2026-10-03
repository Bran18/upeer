import Link from 'next/link';
import { Button } from '@/components/ui/button';

type Props = {
  filtered: boolean;
  onResetFilters?: () => void;
};

export function MarketEmpty({ filtered, onResetFilters }: Props) {
  if (filtered) {
    return (
      <div className="ui-card px-6 py-12 text-center">
        <p className="text-base font-medium text-balance">
          No Offers Match These Filters
        </p>
        <p className="mt-2 text-sm text-[var(--foreground-secondary)] text-pretty">
          Try another market (CRC, ARS, BOB, CLP, COP) or show every desk.
        </p>
        {onResetFilters ? (
          <Button
            type="button"
            variant="secondary"
            className="mt-6"
            onClick={onResetFilters}
          >
            Clear Filters
          </Button>
        ) : null}
      </div>
    );
  }

  return (
    <div className="ui-card px-6 py-12 text-center">
      <p className="text-base font-medium text-balance">No Live Offers Yet</p>
      <p className="mx-auto mt-2 max-w-md text-sm text-[var(--foreground-secondary)] text-pretty">
        Merchants publish USDC inventory on testnet after verification. Check
        back soon—or list liquidity from your desk.
      </p>
      <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
        <Link href="/merchant" className="btn-primary">
          Open Merchant Desk
        </Link>
        <Link href="/onboarding" className="btn-secondary">
          Finish Setup
        </Link>
      </div>
    </div>
  );
}
