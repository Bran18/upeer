'use client';

import Link from 'next/link';
import { PAYMENT_RAIL_OPTIONS } from '@/lib/fiat/coverage';
import { fieldsForRail } from '@/lib/fiat/rail-details';
import type { FiatSettlementSnapshot } from '@/lib/orders/fiat-settlement';
import { shortenWallet } from '@/lib/nav/user-identity';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/toaster';

type Props = {
  fiatSettlement: FiatSettlementSnapshot | null;
  usdcReleaseAddress: string | null;
  showUsdcRelease: boolean;
  viewerIsUsdcBuyer: boolean;
  viewerIsUsdcSeller: boolean;
};

function railLabel(rail: FiatSettlementSnapshot['method']['rail']): string {
  return (
    PAYMENT_RAIL_OPTIONS.find((option) => option.value === rail)?.label ?? rail
  );
}

async function copyText(value: string, label: string, toast: ReturnType<typeof useToast>) {
  try {
    await navigator.clipboard.writeText(value);
    toast.success(`${label} copied`);
  } catch {
    toast.error('Could not copy');
  }
}

export function OrderSettlementDetails({
  fiatSettlement,
  usdcReleaseAddress,
  showUsdcRelease,
  viewerIsUsdcBuyer,
  viewerIsUsdcSeller,
}: Props) {
  const toast = useToast();

  if (!fiatSettlement && !showUsdcRelease) {
    return null;
  }

  const method = fiatSettlement?.method;
  const detailFields = method
    ? fieldsForRail(method.rail, method.currency)
    : [];

  const fiatHeading =
    viewerIsUsdcBuyer && fiatSettlement
      ? 'Send fiat here'
      : viewerIsUsdcSeller && fiatSettlement
        ? 'You receive fiat here'
        : fiatSettlement
          ? 'Fiat account for this trade'
          : null;

  return (
    <div className="mt-6 space-y-5 border-t border-[var(--line)] pt-5">
      {fiatSettlement && method && fiatHeading ? (
        <div>
          <h3 className="text-sm font-semibold tracking-tight">{fiatHeading}</h3>
          <p className="mt-1 text-xs text-[var(--foreground-tertiary)] text-pretty">
            {railLabel(method.rail)} · {method.currency}
          </p>
          <dl className="mt-3 space-y-2">
            <div className="rounded-[var(--radius-ui)] border border-[var(--line)] bg-[var(--fill)] px-3 py-2">
              <dt className="text-xs text-[var(--foreground-tertiary)]">
                Account holder
              </dt>
              <dd className="mt-0.5 flex items-center justify-between gap-2 text-sm font-medium">
                <span className="min-w-0 truncate">{method.holderName}</span>
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  onClick={() =>
                    void copyText(method.holderName, 'Name', toast)
                  }
                >
                  Copy
                </Button>
              </dd>
            </div>
            {detailFields.map((field) => {
              const raw = method.details[field.key];
              const value = typeof raw === 'string' ? raw.trim() : '';
              if (!value) {
                return null;
              }
              return (
                <div
                  key={field.key}
                  className="rounded-[var(--radius-ui)] border border-[var(--line)] bg-[var(--fill)] px-3 py-2"
                >
                  <dt className="text-xs text-[var(--foreground-tertiary)]">
                    {field.label}
                  </dt>
                  <dd className="mt-0.5 flex items-center justify-between gap-2 text-sm font-medium tabular-nums">
                    <span className="min-w-0 break-all">{value}</span>
                    <Button
                      type="button"
                      variant="secondary"
                      size="sm"
                      onClick={() => void copyText(value, field.label, toast)}
                    >
                      Copy
                    </Button>
                  </dd>
                </div>
              );
            })}
            {method.details.note?.trim() ? (
              <div className="rounded-[var(--radius-ui)] border border-[var(--line)] bg-[var(--fill)] px-3 py-2">
                <dt className="text-xs text-[var(--foreground-tertiary)]">Note</dt>
                <dd className="mt-0.5 text-sm text-[var(--foreground-secondary)] text-pretty">
                  {method.details.note}
                </dd>
              </div>
            ) : null}
          </dl>
        </div>
      ) : null}

      {showUsdcRelease ? (
        <div>
          <h3 className="text-sm font-semibold tracking-tight">
            USDC release address
          </h3>
          <p className="mt-1 text-xs text-[var(--foreground-tertiary)] text-pretty">
            Escrow sends USDC here after fiat is confirmed.
          </p>
          {usdcReleaseAddress ? (
            <div className="mt-3 rounded-[var(--radius-ui)] border border-[var(--line)] bg-[var(--fill)] px-3 py-2">
              <p className="font-mono text-xs break-all sm:text-sm">
                {usdcReleaseAddress}
              </p>
              <div className="mt-2 flex flex-wrap items-center gap-2">
                <span className="text-xs text-[var(--foreground-tertiary)]">
                  {shortenWallet(usdcReleaseAddress)}
                </span>
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  onClick={() =>
                    void copyText(usdcReleaseAddress, 'Address', toast)
                  }
                >
                  Copy
                </Button>
              </div>
            </div>
          ) : (
            <p className="mt-3 text-sm text-[var(--foreground-secondary)] text-pretty">
              {viewerIsUsdcBuyer
                ? 'USDC buyer wallet address missing. Set your payout address in settings before escrow deploy.'
                : 'USDC buyer wallet address missing.'}
              {viewerIsUsdcBuyer ? (
                <Link
                  href="/settings?tab=payout"
                  className="mt-2 block text-sm font-medium text-[var(--accent)] hover:underline"
                >
                  Open payout settings
                </Link>
              ) : null}
            </p>
          )}
        </div>
      ) : null}
    </div>
  );
}
