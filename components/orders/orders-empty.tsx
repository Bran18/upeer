import Link from 'next/link';
import { Button } from '@/components/ui/button';

type Props = {
  filtered: boolean;
  signedIn: boolean;
  onResetFilters?: () => void;
  onSignIn?: () => void;
};

export function OrdersEmpty({
  filtered,
  signedIn,
  onResetFilters,
  onSignIn,
}: Props) {
  if (!signedIn) {
    return (
      <div className="ui-card px-6 py-12 text-center">
        <p className="text-base font-medium text-balance">Sign In to See Orders</p>
        <p className="mx-auto mt-2 max-w-md text-sm text-[var(--foreground-secondary)] text-pretty">
          Your takes and incoming requests live here after you sign in with
          Pollar.
        </p>
        {onSignIn ? (
          <Button type="button" className="mt-6" onClick={onSignIn}>
            Sign In
          </Button>
        ) : null}
      </div>
    );
  }

  if (filtered) {
    return (
      <div className="ui-card px-6 py-12 text-center">
        <p className="text-base font-medium text-balance">
          No Orders in This View
        </p>
        <p className="mt-2 text-sm text-[var(--foreground-secondary)] text-pretty">
          Try All Orders, or open the market to take a live desk.
        </p>
        <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
          {onResetFilters ? (
            <Button type="button" variant="secondary" onClick={onResetFilters}>
              Show All Orders
            </Button>
          ) : null}
          <Link href="/market" className="btn-primary">
            Browse Market
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="ui-card px-6 py-12 text-center">
      <p className="text-base font-medium text-balance">No Orders Yet</p>
      <p className="mx-auto mt-2 max-w-md text-sm text-[var(--foreground-secondary)] text-pretty">
        Take an open offer or post liquidity from your desk. Settled and active
        trades will show up here.
      </p>
      <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
        <Link href="/market" className="btn-primary">
          Browse Market
        </Link>
        <Link href="/orders/new" className="btn-secondary">
          Post Order
        </Link>
      </div>
    </div>
  );
}
