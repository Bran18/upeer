'use client';

import { usePollar } from '@pollar/react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useMemo, useState, useTransition, ViewTransition } from 'react';
import { FiatMarketSelect } from '@/components/fiat/fiat-market-select';
import { PostOrderPreview } from '@/components/orders/post-order-preview';
import {
  PostOrderSidePills,
  type PostOrderSide,
} from '@/components/orders/post-order-side-pills';
import { useUpeerSession } from '@/components/session/upeer-session-provider';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/toaster';
import {
  DEFAULT_FIAT_CURRENCY,
  marketForCurrency,
  UPEER_COVERAGE_BLURB,
} from '@/lib/fiat/coverage';
import type { MeProfile } from '@/lib/profile/types';
import {
  exchangePollarSessionFromClient,
  readStoredSession,
  upeerAuthedFetch,
} from '@/lib/upeer-api';

const STELLAR_G_REGEX = /^G[ABCDEFGHIJKLMNOPQRSTUVWXYZ234567]{55}$/;

type FormState = {
  side: PostOrderSide;
  fiatCurrency: string;
  pricePerUsdc: string;
  minUsdc: string;
  maxUsdc: string;
  availableUsdc: string;
  payoutAddress: string;
};

function hasFiatMethodForCurrency(profile: MeProfile, currency: string): boolean {
  const code = currency.toUpperCase();
  return profile.paymentPrefs.methods.some(
    (method) => method.currency.toUpperCase() === code,
  );
}

function PostOrderSection({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <section className="space-y-4 border-b border-[var(--line)] pb-6 last:border-b-0 last:pb-0">
      <div>
        <h2 className="text-sm font-medium text-[var(--foreground)]">{title}</h2>
        <p className="mt-1 text-xs leading-relaxed text-[var(--foreground-tertiary)] text-pretty">
          {description}
        </p>
      </div>
      {children}
    </section>
  );
}

export function PostOrderView() {
  const router = useRouter();
  const toast = useToast();
  const { isAuthenticated, verified, getClient } = usePollar();
  const { profile, status: sessionStatus } = useUpeerSession();
  const [isNavigating, startNavigation] = useTransition();
  const [busy, setBusy] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [overridePayout, setOverridePayout] = useState(false);

  const [form, setForm] = useState<FormState>(() => ({
    side: 'sell_usdc',
    fiatCurrency: DEFAULT_FIAT_CURRENCY,
    pricePerUsdc:
      marketForCurrency(DEFAULT_FIAT_CURRENCY)?.examplePricePerUsdc ?? '520',
    minUsdc: '50',
    maxUsdc: '5000',
    availableUsdc: '1000',
    payoutAddress: '',
  }));

  const savedPayout = profile?.payoutAddress?.trim() ?? '';
  const payoutDraft = form.payoutAddress.trim();
  const effectivePayout = payoutDraft || savedPayout;
  const payoutReady = STELLAR_G_REGEX.test(effectivePayout);
  const fiatReady = profile
    ? hasFiatMethodForCurrency(profile, form.fiatCurrency)
    : false;

  const showPayoutField = !savedPayout || overridePayout;

  const setupAlerts = useMemo(() => {
    const alerts: { id: string; message: string; href: string; label: string }[] = [];
    if (!payoutReady) {
      alerts.push({
        id: 'payout',
        message: 'Escrow needs a Stellar G-address to release USDC to you.',
        href: '/settings?tab=payout',
        label: 'Set payout in settings',
      });
    }
    if (form.side === 'sell_usdc' && profile && !fiatReady) {
      alerts.push({
        id: 'fiat',
        message: `Add how buyers pay you in ${form.fiatCurrency} before you sell USDC.`,
        href: '/settings?tab=fiat',
        label: 'Add fiat payment method',
      });
    }
    return alerts;
  }, [payoutReady, form.side, form.fiatCurrency, profile, fiatReady]);

  const ensureSession = async () => {
    let session = readStoredSession();
    if (!session) {
      const auth = getClient().getAuthState();
      if (auth.step !== 'authenticated') {
        throw new Error('Sign in with Pollar first');
      }
      session = await exchangePollarSessionFromClient(getClient());
    }
    return session;
  };

  const validate = (): string | null => {
    const price = Number(form.pricePerUsdc);
    if (!Number.isFinite(price) || price <= 0) {
      return 'Enter a valid price per USDC (greater than zero).';
    }
    const min = Number(form.minUsdc);
    const max = Number(form.maxUsdc);
    const available = Number(form.availableUsdc);
    if (![min, max, available].every((n) => Number.isFinite(n) && n > 0)) {
      return 'Min, max, and listed size must be positive numbers.';
    }
    if (min > max) {
      return 'Minimum trade size cannot exceed the maximum.';
    }
    if (max > available) {
      return 'Maximum trade size cannot exceed the listed size.';
    }
    if (!payoutReady) {
      return 'Set a valid Stellar payout address (G…, 56 characters).';
    }
    if (payoutDraft && !STELLAR_G_REGEX.test(payoutDraft)) {
      return 'Payout address must be a valid Stellar public key.';
    }
    return null;
  };

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setFormError(null);
    const validationError = validate();
    if (validationError) {
      setFormError(validationError);
      toast.error('Check the form', validationError);
      return;
    }

    setBusy(true);
    try {
      await ensureSession();
      const res = await upeerAuthedFetch('/api/offers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          side: form.side,
          fiatCurrency: form.fiatCurrency,
          pricePerUsdc: form.pricePerUsdc,
          minUsdc: String(minUsdcForApi(form.minUsdc)),
          maxUsdc: String(maxUsdcForApi(form.maxUsdc)),
          availableUsdc: String(maxUsdcForApi(form.availableUsdc)),
          ...(payoutDraft ? { payoutAddress: payoutDraft } : {}),
        }),
      });
      const data = (await res.json()) as { error?: string };
      if (!res.ok) {
        throw new Error(data.error ?? 'Failed to post order');
      }
      toast.success('Order posted', 'Your listing is live on the market.');
      startNavigation(() => {
        router.push('/market');
        router.refresh();
      });
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : 'Failed to post order';
      setFormError(message);
      toast.error('Could not post order', message);
    } finally {
      setBusy(false);
    }
  }

  if (!isAuthenticated || !verified) {
    return (
      <p className="text-sm text-[var(--foreground-secondary)]">
        Sign in to post an order on the market.
      </p>
    );
  }

  if (sessionStatus === 'syncing') {
    return (
      <p className="text-sm text-[var(--foreground-secondary)]" role="status" aria-live="polite">
        Loading your account…
      </p>
    );
  }

  const submitting = busy || isNavigating;

  return (
    <div className="space-y-0">
      <div className="settings-hero">
        <div className="relative z-[1] max-w-xl">
          <p className="settings-hero-kicker">Market maker</p>
          <h1 className="mt-2 text-2xl font-semibold tracking-tight sm:text-3xl">
            Post order
          </h1>
          <p className="mt-2 text-sm leading-relaxed text-white/85 text-pretty">
            Set your price in local currency per 1 USDC for {UPEER_COVERAGE_BLURB}.
            Takers request a trade; you accept before escrow starts.
          </p>
        </div>
        <div className="settings-hero-art" aria-hidden>
          <span className="settings-hero-icon">📋</span>
        </div>
      </div>

      {setupAlerts.length > 0 ? (
        <ul className="mt-4 space-y-2" aria-label="Setup reminders">
          {setupAlerts.map((alert) => (
            <li
              key={alert.id}
              className="flex flex-wrap items-center justify-between gap-3 rounded-[var(--radius-ui)] border border-amber-500/35 bg-amber-500/10 px-4 py-3 text-sm text-[var(--foreground)]"
            >
              <span className="text-pretty">{alert.message}</span>
              <Link
                href={alert.href}
                className="shrink-0 font-medium text-[var(--accent)] hover:underline"
              >
                {alert.label}
              </Link>
            </li>
          ))}
        </ul>
      ) : null}

      <div className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(16rem,20rem)] lg:items-start">
        <form
          onSubmit={handleSubmit}
          className="ui-card space-y-6 px-5 py-6 sm:px-6"
          noValidate
        >
          <PostOrderSection
            title="Trade direction"
            description="Choose whether you are offering USDC or looking to buy it."
          >
            <PostOrderSidePills
              value={form.side}
              onChange={(side) => setForm((f) => ({ ...f, side }))}
            />
          </PostOrderSection>

          <PostOrderSection
            title="Pricing & market"
            description="Price is fiat paid or received per 1 USDC (peer-to-peer, off-chain settlement)."
          >
            <div className="grid gap-4 sm:grid-cols-2">
              <FiatMarketSelect
                id="post-fiat"
                value={form.fiatCurrency}
                onChange={(currency) => {
                  const market = marketForCurrency(currency);
                  setForm((f) => ({
                    ...f,
                    fiatCurrency: currency,
                    pricePerUsdc: market?.examplePricePerUsdc ?? f.pricePerUsdc,
                  }));
                }}
              />
              <div>
                <label className="field-label" htmlFor="post-price">
                  Price per 1 USDC
                </label>
                <p className="mt-1 text-xs text-[var(--foreground-tertiary)]">
                  In {form.fiatCurrency}.
                </p>
                <input
                  id="post-price"
                  name="pricePerUsdc"
                  type="text"
                  inputMode="decimal"
                  autoComplete="off"
                  spellCheck={false}
                  className="field-input tabular-nums mt-2"
                  value={form.pricePerUsdc}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, pricePerUsdc: e.target.value }))
                  }
                />
              </div>
            </div>
          </PostOrderSection>

          <PostOrderSection
            title="Size limits"
            description="How much USDC this listing can fill, and the range per trade."
          >
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="field-label" htmlFor="post-available">
                  Listed size (USDC)
                </label>
                <input
                  id="post-available"
                  name="availableUsdc"
                  type="text"
                  inputMode="decimal"
                  autoComplete="off"
                  spellCheck={false}
                  className="field-input tabular-nums mt-2"
                  value={form.availableUsdc}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, availableUsdc: e.target.value }))
                  }
                />
              </div>
              <div>
                <span className="field-label">Per-trade range (USDC)</span>
                <div className="mt-2 flex gap-2">
                  <div className="min-w-0 flex-1">
                    <label className="sr-only" htmlFor="post-min">Minimum</label>
                    <input
                      id="post-min"
                      name="minUsdc"
                      type="text"
                      inputMode="decimal"
                      autoComplete="off"
                      spellCheck={false}
                      placeholder="Min"
                      className="field-input tabular-nums w-full"
                      value={form.minUsdc}
                      onChange={(e) =>
                        setForm((f) => ({ ...f, minUsdc: e.target.value }))
                      }
                    />
                  </div>
                  <div className="min-w-0 flex-1">
                    <label className="sr-only" htmlFor="post-max">Maximum</label>
                    <input
                      id="post-max"
                      name="maxUsdc"
                      type="text"
                      inputMode="decimal"
                      autoComplete="off"
                      spellCheck={false}
                      placeholder="Max"
                      className="field-input tabular-nums w-full"
                      value={form.maxUsdc}
                      onChange={(e) =>
                        setForm((f) => ({ ...f, maxUsdc: e.target.value }))
                      }
                    />
                  </div>
                </div>
              </div>
            </div>
          </PostOrderSection>

          <PostOrderSection
            title="USDC payout"
            description="Escrow releases sold USDC to this Stellar address."
          >
            {savedPayout && !showPayoutField ? (
              <div className="space-y-2">
                <p className="font-mono text-sm text-[var(--foreground)]" translate="no">
                  {savedPayout}
                </p>
                <p className="text-xs text-[var(--foreground-tertiary)]">
                  Saved in{' '}
                  <Link href="/settings?tab=payout" className="text-[var(--accent)] hover:underline">
                    settings
                  </Link>
                  .{' '}
                  <button
                    type="button"
                    className="text-[var(--accent)] hover:underline"
                    onClick={() => {
                      setOverridePayout(true);
                      setForm((f) => ({ ...f, payoutAddress: '' }));
                    }}
                  >
                    Use a different address for this order
                  </button>
                </p>
              </div>
            ) : (
              <div>
                <label className="field-label" htmlFor="post-payout">
                  Stellar payout address
                </label>
                <input
                  id="post-payout"
                  name="payoutAddress"
                  type="text"
                  spellCheck={false}
                  autoComplete="off"
                  translate="no"
                  className="field-input mt-2 font-mono text-sm"
                  placeholder="G…"
                  value={form.payoutAddress}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, payoutAddress: e.target.value }))
                  }
                />
                {savedPayout ? (
                  <button
                    type="button"
                    className="mt-2 text-xs text-[var(--accent)] hover:underline"
                    onClick={() => {
                      setOverridePayout(false);
                      setForm((f) => ({ ...f, payoutAddress: '' }));
                    }}
                  >
                    Use saved address ({savedPayout.slice(0, 6)}…)
                  </button>
                ) : (
                  <p className="mt-2 text-xs text-[var(--foreground-tertiary)]">
                    Or{' '}
                    <Link href="/settings?tab=payout" className="text-[var(--accent)] hover:underline">
                      save a default in settings
                    </Link>
                    .
                  </p>
                )}
              </div>
            )}
          </PostOrderSection>

          {formError ? (
            <p className="text-sm text-red-600 dark:text-red-300" role="alert">
              {formError}
            </p>
          ) : null}

          <div className="flex flex-wrap items-center gap-3 pt-2">
            <Button type="submit" disabled={submitting} aria-busy={submitting}>
              {submitting ? 'Posting…' : 'Post to market'}
            </Button>
            <Link
              href="/market"
              className="text-sm font-medium text-[var(--foreground-secondary)] hover:text-[var(--foreground)]"
            >
              Cancel
            </Link>
          </div>
        </form>

        <ViewTransition update="auto" default="none">
          <PostOrderPreview
            side={form.side}
            fiatCurrency={form.fiatCurrency}
            pricePerUsdc={form.pricePerUsdc}
            minUsdc={form.minUsdc}
            maxUsdc={form.maxUsdc}
            availableUsdc={form.availableUsdc}
            payoutReady={payoutReady}
            fiatReady={fiatReady}
          />
        </ViewTransition>
      </div>

      <p className="mt-6 text-sm text-[var(--foreground-tertiary)]">
        <Link href="/orders" className="font-medium text-[var(--accent)] hover:underline">
          ← Your trades
        </Link>
      </p>
    </div>
  );
}

/** API stores decimal strings; keep user-friendly integers when whole. */
function minUsdcForApi(value: string): string {
  const n = Number(value);
  if (!Number.isFinite(n)) {
    return value;
  }
  return n.toFixed(7);
}

function maxUsdcForApi(value: string): string {
  return minUsdcForApi(value);
}
