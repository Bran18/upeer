'use client';

import { useEffect, useState } from 'react';
import { useUpeerSession } from '@/components/session/upeer-session-provider';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { IconChevronDown } from '@/components/ui/icons/chevron';
import { useToast } from '@/components/ui/toaster';
import { FiatMarketSelect } from '@/components/fiat/fiat-market-select';
import {
  DEFAULT_FIAT_CURRENCY,
  formatFiatBadge,
  PAYMENT_RAIL_OPTIONS,
  railsForCurrency,
  type PaymentRail,
  UPEER_COVERAGE_BLURB,
} from '@/lib/fiat/coverage';
import {
  destinationPreview,
  emptyDetails,
  fieldsForRail,
  sanitizeDetails,
  validateRailDetails,
  type RailDetailKey,
} from '@/lib/fiat/rail-details';
import {
  createEmptyPaymentMethod,
  EMPTY_PAYMENT_PREFS,
  type FiatPaymentMethod,
  type PaymentPrefs,
} from '@/lib/profile/payment-prefs';
import { updateMeProfile } from '@/lib/upeer-api';
import { cn } from '@/lib/cn';

function ensureRailForCurrency(
  rail: PaymentRail,
  currency: string,
): PaymentRail {
  const options = railsForCurrency(currency);
  if (options.some((o) => o.value === rail)) {
    return rail;
  }
  return options[0]?.value ?? 'bank_transfer';
}

function railLabel(rail: PaymentRail): string {
  return PAYMENT_RAIL_OPTIONS.find((option) => option.value === rail)?.label ?? rail;
}

function isIncomplete(method: FiatPaymentMethod): boolean {
  return Boolean(
    validateRailDetails(
      method.rail,
      method.currency,
      method.details,
      method.holderName,
    ),
  );
}

export function FiatPaymentSettingsForm() {
  const toast = useToast();
  const { profile, refreshProfile, status } = useUpeerSession();
  const [prefs, setPrefs] = useState<PaymentPrefs>(EMPTY_PAYMENT_PREFS);
  const [openId, setOpenId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (status !== 'ready' || !profile) {
      return;
    }
    const next = profile.paymentPrefs ?? EMPTY_PAYMENT_PREFS;
    setPrefs(next);
    const preferred =
      next.methods.find((m) => m.id === next.primaryMethodId) ?? next.methods[0];
    const incomplete = next.methods.find((m) => isIncomplete(m));
    setOpenId((incomplete ?? preferred)?.id ?? null);
  }, [status, profile]);

  function updateMethod(id: string, patch: Partial<FiatPaymentMethod>) {
    setPrefs((prev) => ({
      ...prev,
      methods: prev.methods.map((m) => {
        if (m.id !== id) {
          return m;
        }
        const currency = patch.currency ?? m.currency;
        const rail = ensureRailForCurrency(patch.rail ?? m.rail, currency);
        const railChanged = rail !== m.rail || currency !== m.currency;
        return {
          ...m,
          ...patch,
          currency,
          rail,
          details: railChanged ? emptyDetails() : m.details,
        };
      }),
    }));
    setError(null);
  }

  function updateDetail(id: string, key: RailDetailKey, value: string) {
    setPrefs((prev) => ({
      ...prev,
      methods: prev.methods.map((m) =>
        m.id === id ? { ...m, details: { ...m.details, [key]: value } } : m,
      ),
    }));
    setError(null);
  }

  function removeMethod(id: string) {
    setPrefs((prev) => {
      const methods = prev.methods.filter((m) => m.id !== id);
      const primaryMethodId =
        prev.primaryMethodId === id ? (methods[0]?.id ?? null) : prev.primaryMethodId;
      return { primaryMethodId, methods };
    });
    setOpenId((current) => (current === id ? null : current));
  }

  function addMethod() {
    const method = createEmptyPaymentMethod(DEFAULT_FIAT_CURRENCY);
    setPrefs((prev) => ({
      primaryMethodId: prev.primaryMethodId ?? method.id,
      methods: [...prev.methods, method],
    }));
    setOpenId(method.id);
    setError(null);
  }

  async function handleSave(event: React.FormEvent) {
    event.preventDefault();
    const methods: FiatPaymentMethod[] = [];
    for (const method of prefs.methods) {
      const details = sanitizeDetails(method.rail, method.currency, method.details);
      const message = validateRailDetails(
        method.rail,
        method.currency,
        details,
        method.holderName,
      );
      if (message) {
        setError(message);
        setOpenId(method.id);
        toast.error('Could not save', message);
        return;
      }
      methods.push({ ...method, details });
    }
    setBusy(true);
    setError(null);
    try {
      await updateMeProfile({
        paymentPrefs: { ...prefs, methods },
      });
      await refreshProfile();
      toast.success(
        'Payment methods saved',
        methods.length === 1
          ? 'Buyers will see this destination on P2P trades.'
          : `${methods.length} methods are ready for P2P trades.`,
      );
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'Could not save payment methods.';
      setError(message);
      toast.error('Could not save', message);
    } finally {
      setBusy(false);
    }
  }

  if (status !== 'ready' || !profile) {
    return null;
  }

  const isSeller =
    profile.platformIntent === 'merchant' || profile.platformIntent === 'both';

  return (
    <form onSubmit={handleSave} className="space-y-6" noValidate>
      <p className="mx-auto max-w-2xl text-sm text-[var(--foreground-secondary)] text-pretty">
        {isSeller
          ? `These are the exact details a buyer types into their bank or wallet. ${UPEER_COVERAGE_BLURB}.`
          : `Optional. Save how you usually pay sellers in ${UPEER_COVERAGE_BLURB}.`}
      </p>

      {prefs.methods.length === 0 ? (
        <div className="mx-auto max-w-lg rounded-[var(--radius-ui)] border border-dashed border-[var(--line)] bg-[var(--fill)] px-4 py-8 text-center">
          <p className="text-sm font-medium">No payment methods yet</p>
          <p className="mt-1 text-sm text-[var(--foreground-secondary)]">
            Add how counterparties should send you local currency.
          </p>
          <Button type="button" className="mt-4" onClick={addMethod}>
            Add payment method
          </Button>
        </div>
      ) : (
        <ul className="mx-auto flex max-w-2xl flex-col gap-3">
          {prefs.methods.map((method) => (
            <MethodCard
              key={method.id}
              method={method}
              open={openId === method.id}
              preferred={prefs.primaryMethodId === method.id}
              onToggle={() =>
                setOpenId((current) => (current === method.id ? null : method.id))
              }
              onPrefer={() => {
                setPrefs((prev) => ({ ...prev, primaryMethodId: method.id }));
              }}
              onRemove={() => removeMethod(method.id)}
              onChange={(patch) => updateMethod(method.id, patch)}
              onDetail={(key, value) => updateDetail(method.id, key, value)}
            />
          ))}
        </ul>
      )}

      {prefs.methods.length > 0 ? (
        <div className="mx-auto flex max-w-2xl flex-wrap gap-3">
          <Button type="button" variant="secondary" onClick={addMethod}>
            Add another method
          </Button>
          <Button type="submit" disabled={busy} aria-busy={busy}>
            {busy ? 'Saving…' : 'Save payment methods'}
          </Button>
        </div>
      ) : null}

      {error ? (
        <p className="text-center text-sm text-red-800 dark:text-red-200" role="alert">
          {error}
        </p>
      ) : null}
    </form>
  );
}

function MethodCard({
  method,
  open,
  preferred,
  onToggle,
  onPrefer,
  onRemove,
  onChange,
  onDetail,
}: {
  method: FiatPaymentMethod;
  open: boolean;
  preferred: boolean;
  onToggle: () => void;
  onPrefer: () => void;
  onRemove: () => void;
  onChange: (patch: Partial<FiatPaymentMethod>) => void;
  onDetail: (key: RailDetailKey, value: string) => void;
}) {
  const fields = fieldsForRail(method.rail, method.currency);
  const incomplete = isIncomplete(method);
  const panelId = `method-panel-${method.id}`;

  return (
    <li className="overflow-hidden rounded-[var(--radius-ui)] border border-[var(--line)] bg-[var(--fill)]">
      <div className="flex items-stretch gap-1">
        <button
          type="button"
          className="flex min-w-0 flex-1 items-start gap-3 px-4 py-3.5 text-left"
          aria-expanded={open}
          aria-controls={panelId}
          onClick={onToggle}
        >
          <IconChevronDown
            open={open}
            className="mt-0.5 text-[var(--foreground-tertiary)]"
          />
          <span className="min-w-0 flex-1">
            <span className="flex flex-wrap items-center gap-2">
              <span className="text-sm font-medium">{railLabel(method.rail)}</span>
              <Badge variant="muted">{formatFiatBadge(method.currency)}</Badge>
              {preferred ? <Badge variant="accent">Preferred</Badge> : null}
              {incomplete ? <Badge variant="muted">Needs details</Badge> : null}
            </span>
            <span className="mt-1 block truncate text-sm text-[var(--foreground-secondary)]">
              {method.holderName.trim() || 'No holder name'} ·{' '}
              {destinationPreview(method.rail, method.details)}
            </span>
          </span>
        </button>
        <button
          type="button"
          className="shrink-0 px-3 text-xs text-red-700 dark:text-red-300"
          onClick={onRemove}
        >
          Remove
        </button>
      </div>

      {open ? (
        <div id={panelId} className="border-t border-[var(--line)] px-4 py-4">
          <label className="inline-flex items-center gap-2 text-sm">
            <input
              type="radio"
              name="primaryMethod"
              checked={preferred}
              onChange={onPrefer}
            />
            <span>Use this as the preferred method</span>
          </label>

          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <FiatMarketSelect
              id={`currency-${method.id}`}
              value={method.currency}
              onChange={(currency) => onChange({ currency })}
              label="Market"
              hint=""
            />
            <div>
              <label className="field-label" htmlFor={`rail-${method.id}`}>
                How they pay you
              </label>
              <select
                id={`rail-${method.id}`}
                className="field-input mt-2"
                value={method.rail}
                onChange={(e) =>
                  onChange({ rail: e.target.value as PaymentRail })
                }
              >
                {railsForCurrency(method.currency).map((rail) => (
                  <option key={rail.value} value={rail.value}>
                    {rail.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="mt-4">
            <label className="field-label" htmlFor={`holder-${method.id}`}>
              Account holder name
            </label>
            <p className="mt-1 text-xs text-[var(--foreground-tertiary)]">
              Legal name the payer should see when they confirm the transfer.
            </p>
            <input
              id={`holder-${method.id}`}
              className="field-input mt-2"
              maxLength={80}
              value={method.holderName}
              onChange={(e) => onChange({ holderName: e.target.value })}
              placeholder="Name on the account"
              autoComplete="name"
            />
          </div>

          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            {fields.map((field) => (
              <div
                key={field.key}
                className={
                  field.key === 'meetingPlace' || field.key === 'destination'
                    ? 'sm:col-span-2'
                    : undefined
                }
              >
                <label className="field-label" htmlFor={`${field.key}-${method.id}`}>
                  {field.label}
                </label>
                {field.hint ? (
                  <p className="mt-1 text-xs text-[var(--foreground-tertiary)] text-pretty">
                    {field.hint}
                  </p>
                ) : null}
                {field.options ? (
                  <select
                    id={`${field.key}-${method.id}`}
                    className="field-input mt-2"
                    value={method.details[field.key] ?? ''}
                    onChange={(e) => onDetail(field.key, e.target.value)}
                    required={field.required}
                  >
                    <option value="">Select…</option>
                    {field.options.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                ) : (
                  <input
                    id={`${field.key}-${method.id}`}
                    className="field-input mt-2"
                    value={method.details[field.key] ?? ''}
                    onChange={(e) => onDetail(field.key, e.target.value)}
                    placeholder={field.placeholder}
                    inputMode={field.inputMode}
                    maxLength={field.maxLength}
                    autoComplete="off"
                    spellCheck={false}
                    required={field.required}
                  />
                )}
              </div>
            ))}
          </div>

          <div className="mt-4">
            <label className="field-label" htmlFor={`note-${method.id}`}>
              Extra note (optional)
            </label>
            <textarea
              id={`note-${method.id}`}
              className={cn('field-input mt-2 min-h-[4.5rem] resize-y')}
              maxLength={400}
              value={method.details.note ?? ''}
              onChange={(e) => onDetail('note', e.target.value)}
              placeholder="Reference text, branch, or anything the payer should add."
            />
          </div>
        </div>
      ) : null}
    </li>
  );
}
