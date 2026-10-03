'use client';

import Link from 'next/link';
import { PAYMENT_RAIL_OPTIONS } from '@/lib/fiat/coverage';
import { destinationPreview } from '@/lib/fiat/rail-details';
import type { FiatPaymentMethod, PaymentPrefs } from '@/lib/profile/payment-prefs';
import { cn } from '@/lib/cn';

export function paymentMethodsForCurrency(
  prefs: PaymentPrefs,
  currency: string,
): FiatPaymentMethod[] {
  const code = currency.toUpperCase();
  return prefs.methods.filter((m) => m.currency === code);
}

export function defaultPaymentMethodId(
  prefs: PaymentPrefs,
  currency: string,
): string | null {
  const methods = paymentMethodsForCurrency(prefs, currency);
  if (methods.length === 0) {
    return null;
  }
  if (
    prefs.primaryMethodId &&
    methods.some((m) => m.id === prefs.primaryMethodId)
  ) {
    return prefs.primaryMethodId;
  }
  return methods[0]?.id ?? null;
}

function railLabel(rail: FiatPaymentMethod['rail']): string {
  return (
    PAYMENT_RAIL_OPTIONS.find((option) => option.value === rail)?.label ?? rail
  );
}

type Props = {
  currency: string;
  prefs: PaymentPrefs;
  value: string | null;
  onChange: (methodId: string) => void;
  disabled?: boolean;
  legend: string;
};

export function PaymentMethodPicker({
  currency,
  prefs,
  value,
  onChange,
  disabled,
  legend,
}: Props) {
  const methods = paymentMethodsForCurrency(prefs, currency);

  if (methods.length === 0) {
    return (
      <div className="rounded-[var(--radius-ui)] border border-[var(--line)] bg-[var(--fill)] px-3 py-3">
        <p className="text-sm text-[var(--foreground-secondary)] text-pretty">
          Add how you receive {currency} before you continue.
        </p>
        <Link
          href="/settings?tab=fiat"
          className="mt-2 inline-block text-sm font-medium text-[var(--accent)] hover:underline"
        >
          Add fiat payment method
        </Link>
      </div>
    );
  }

  return (
    <fieldset className="space-y-2" disabled={disabled}>
      <legend className="text-sm font-medium">{legend}</legend>
      <ul className="space-y-2">
        {methods.map((method) => {
          const selected = value === method.id;
          return (
            <li key={method.id}>
              <label
                className={cn(
                  'flex cursor-pointer gap-3 rounded-[var(--radius-ui)] border px-3 py-3 transition-colors',
                  selected
                    ? 'border-[var(--accent)] bg-[var(--fill)]'
                    : 'border-[var(--line)] bg-[var(--surface-elevated)] hover:border-[var(--line-strong)]',
                )}
              >
                <input
                  type="radio"
                  name="paymentMethodId"
                  className="mt-1"
                  checked={selected}
                  onChange={() => onChange(method.id)}
                />
                <span className="min-w-0 flex-1">
                  <span className="block text-sm font-medium">
                    {railLabel(method.rail)} · {method.currency}
                  </span>
                  <span className="mt-0.5 block text-sm text-[var(--foreground-secondary)]">
                    {method.holderName}
                  </span>
                  <span className="mt-0.5 block truncate text-xs text-[var(--foreground-tertiary)] tabular-nums">
                    {destinationPreview(method.rail, method.details)}
                  </span>
                </span>
              </label>
            </li>
          );
        })}
      </ul>
    </fieldset>
  );
}
