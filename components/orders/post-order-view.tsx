'use client';

import { usePollar } from '@pollar/react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useMemo, useState, useTransition, ViewTransition } from 'react';
import { FiatMarketSelect } from '@/components/fiat/fiat-market-select';
import { PostOrderSizeFields } from '@/components/orders/post-order-size-fields';
import { PostOrderPreview } from '@/components/orders/post-order-preview';
import { PostOrderReviewStep } from '@/components/orders/post-order-review-step';
import {
  PostOrderEditFooter,
  PostOrderReviewFooter,
} from '@/components/orders/post-order-wizard-footer';
import {
  PostOrderStepNav,
  type PostOrderStep,
} from '@/components/orders/post-order-step-nav';
import {
  PostOrderSidePills,
  type PostOrderSide,
} from '@/components/orders/post-order-side-pills';
import { useUpeerSession } from '@/components/session/upeer-session-provider';
import { useToast } from '@/components/ui/toaster';
import {
  DEFAULT_FIAT_CURRENCY,
  marketForCurrency,
  UPEER_COVERAGE_BLURB,
} from '@/lib/fiat/coverage';
import type { MeProfile } from '@/lib/profile/types';
import type { PostOrderFormState } from '@/lib/orders/post-order-types';
import {
  maxUsdcForApi,
  minUsdcForApi,
  validatePostOrderStep,
} from '@/lib/orders/post-order-validation';
import {
  exchangePollarSessionFromClient,
  readStoredSession,
  upeerAuthedFetch,
} from '@/lib/upeer-api';

function hasFiatMethodForCurrency(profile: MeProfile, currency: string): boolean {
  const code = currency.toUpperCase();
  return profile.paymentPrefs.methods.some(
    (method) => method.currency.toUpperCase() === code,
  );
}

const STELLAR_G_REGEX = /^G[ABCDEFGHIJKLMNOPQRSTUVWXYZ234567]{55}$/;

function PostOrderStepPanel({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <section className="space-y-4">
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
  const [step, setStep] = useState<PostOrderStep>(1);
  const [reviewConfirmed, setReviewConfirmed] = useState(false);

  const [form, setForm] = useState<PostOrderFormState>(() => ({
    side: 'sell_usdc',
    fiatCurrency: DEFAULT_FIAT_CURRENCY,
    pricePerUsdc:
      marketForCurrency(DEFAULT_FIAT_CURRENCY)?.examplePricePerUsdc ?? '520',
    minUsdc: '50',
    maxUsdc: '1000',
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
  const isReview = step === 4;

  const setupAlerts = useMemo(() => {
    const alerts: { id: string; message: string; href: string; label: string }[] = [];
    if (step === 3 && !payoutReady) {
      alerts.push({
        id: 'payout',
        message: 'Escrow needs a Stellar G-address to release USDC to you.',
        href: '/settings?tab=payout',
        label: 'Set payout in settings',
      });
    }
    if (step === 1 && form.side === 'sell_usdc' && profile && !fiatReady) {
      alerts.push({
        id: 'fiat',
        message: `Add how buyers pay you in ${form.fiatCurrency} before you sell USDC.`,
        href: '/settings?tab=fiat',
        label: 'Add fiat payment method',
      });
    }
    return alerts;
  }, [step, payoutReady, form.side, form.fiatCurrency, profile, fiatReady]);

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

  const goToEditStep = (next: 1 | 2 | 3) => {
    setFormError(null);
    setReviewConfirmed(false);
    setStep(next);
  };

  const enterReview = () => {
    setFormError(null);
    setReviewConfirmed(false);
    setStep(4);
  };

  const handleContinueEdit = () => {
    const validationError = validatePostOrderStep(step, form, payoutReady, payoutDraft);
    if (validationError) {
      setFormError(validationError);
      toast.error('Check this step', validationError);
      return;
    }
    if (step === 3) {
      enterReview();
      return;
    }
    setFormError(null);
    setStep((step + 1) as PostOrderStep);
  };

  const handleBackFromEdit = () => {
    if (step > 1) {
      setFormError(null);
      setStep((step - 1) as PostOrderStep);
    }
  };

  const handleBackFromReview = () => {
    setFormError(null);
    setReviewConfirmed(false);
    setStep(3);
  };

  function handleEditFormSubmit(event: React.FormEvent) {
    event.preventDefault();
    handleContinueEdit();
  }

  async function submitOrder() {
    if (!reviewConfirmed || step !== 4) {
      return;
    }
    setFormError(null);
    const validationError = validatePostOrderStep(4, form, payoutReady, payoutDraft);
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

  const stepIntro: Record<PostOrderStep, string> = {
    1: `Set side and price per USDC for ${UPEER_COVERAGE_BLURB}.`,
    2: 'Choose how much USDC is on this listing and the size of each trade.',
    3: 'Set where escrow sends USDC when you sell.',
    4: 'Review your listing. Nothing goes live until you confirm and post.',
  };

  const cardClass =
    'ui-card flex flex-col px-5 py-5 sm:px-6 sm:py-6';

  return (
    <div className="space-y-0">
      <header>
        <p className="text-xs font-medium uppercase tracking-[0.14em] text-[var(--foreground-tertiary)]">
          Market maker
        </p>
        <h1 className="mt-1 text-2xl font-semibold tracking-tight text-[var(--foreground)] sm:text-3xl">
          Post order
        </h1>
        <p className="mt-2 text-sm leading-relaxed text-[var(--foreground-secondary)] text-pretty">
          {stepIntro[step]}
        </p>
      </header>

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

      <div className="mt-5 grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(17rem,280px)] lg:items-start">
        {isReview ? (
          <section className={cardClass}>
            <PostOrderStepNav step={step} />
            <div className="mt-5 min-h-0 flex-1">
              <PostOrderReviewStep
                form={form}
                effectivePayout={effectivePayout}
                onEditStep={goToEditStep}
              />
            </div>
            {formError ? (
              <p className="mt-4 text-sm text-red-600 dark:text-red-300" role="alert">
                {formError}
              </p>
            ) : null}
            <PostOrderReviewFooter
              submitting={submitting}
              reviewConfirmed={reviewConfirmed}
              onBack={handleBackFromReview}
              onConfirmReview={() => setReviewConfirmed(true)}
              onPost={() => void submitOrder()}
            />
          </section>
        ) : (
          <form
            onSubmit={handleEditFormSubmit}
            className={cardClass}
            noValidate
          >
            <PostOrderStepNav step={step} />

            <div className="mt-5 min-h-0 flex-1">
              {step === 1 ? (
                <div className="space-y-5">
                  <PostOrderStepPanel
                    title="Trade direction"
                    description="Sell USDC for fiat, or buy USDC with fiat."
                  >
                    <PostOrderSidePills
                      compact
                      value={form.side}
                      onChange={(side) => setForm((f) => ({ ...f, side }))}
                    />
                  </PostOrderStepPanel>
                  <PostOrderStepPanel
                    title="Pricing & market"
                    description="Local currency per 1 USDC."
                  >
                    <div className="space-y-4">
                      <FiatMarketSelect
                        id="post-fiat"
                        value={form.fiatCurrency}
                        hint=""
                        onChange={(currency) => {
                          const market = marketForCurrency(currency);
                          setForm((f) => ({
                            ...f,
                            fiatCurrency: currency,
                            pricePerUsdc:
                              market?.examplePricePerUsdc ?? f.pricePerUsdc,
                          }));
                        }}
                      />
                      <div>
                        <label className="field-label" htmlFor="post-price">
                          Price per 1 USDC ({form.fiatCurrency})
                        </label>
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
                            setForm((f) => ({
                              ...f,
                              pricePerUsdc: e.target.value,
                            }))
                          }
                        />
                      </div>
                    </div>
                  </PostOrderStepPanel>
                </div>
              ) : null}

              {step === 2 ? (
                <PostOrderStepPanel
                  title="How much USDC?"
                  description="Set the total you want on the market, then the size of each individual trade."
                >
                  <PostOrderSizeFields
                    values={{
                      availableUsdc: form.availableUsdc,
                      minUsdc: form.minUsdc,
                      maxUsdc: form.maxUsdc,
                    }}
                    onChange={(patch) => setForm((f) => ({ ...f, ...patch }))}
                  />
                </PostOrderStepPanel>
              ) : null}

              {step === 3 ? (
                <PostOrderStepPanel
                  title="USDC payout"
                  description="Escrow releases sold USDC to this Stellar address."
                >
                  {savedPayout && !showPayoutField ? (
                    <div className="space-y-2">
                      <p
                        className="font-mono text-sm text-[var(--foreground)]"
                        translate="no"
                      >
                        {savedPayout}
                      </p>
                      <p className="text-xs text-[var(--foreground-tertiary)]">
                        Saved in{' '}
                        <Link
                          href="/settings?tab=payout"
                          className="text-[var(--accent)] hover:underline"
                        >
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
                          setForm((f) => ({
                            ...f,
                            payoutAddress: e.target.value,
                          }))
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
                          <Link
                            href="/settings?tab=payout"
                            className="text-[var(--accent)] hover:underline"
                          >
                            save a default in settings
                          </Link>
                          .
                        </p>
                      )}
                    </div>
                  )}
                </PostOrderStepPanel>
              ) : null}
            </div>

            {formError ? (
              <p className="mt-4 text-sm text-red-600 dark:text-red-300" role="alert">
                {formError}
              </p>
            ) : null}

            <PostOrderEditFooter
              step={step}
              submitting={submitting}
              onBack={handleBackFromEdit}
              onContinue={handleContinueEdit}
            />
          </form>
        )}

        <ViewTransition update="auto" default="none">
          <div className="lg:sticky lg:top-24">
            <PostOrderPreview
              step={step}
              side={form.side}
              fiatCurrency={form.fiatCurrency}
              pricePerUsdc={form.pricePerUsdc}
              minUsdc={form.minUsdc}
              maxUsdc={form.maxUsdc}
              availableUsdc={form.availableUsdc}
              payoutReady={payoutReady}
              fiatReady={fiatReady}
            />
          </div>
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
