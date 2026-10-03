'use client';

import { usePollar } from '@pollar/react';
import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useId, useRef, useState } from 'react';
import { RoleOption } from '@/components/onboarding/role-option';
import {
  OnboardingStepNav,
  type OnboardingStep,
} from '@/components/onboarding/onboarding-step-nav';
import { useUpeerSession } from '@/components/session/upeer-session-provider';
import { Button } from '@/components/ui/button';
import { CardDescription, CardTitle } from '@/components/ui/card';
import {
  ONBOARDING_ROLE_OPTIONS,
  onboardingSubmitLabel,
  roleOptionForIntent,
} from '@/lib/onboarding/role-options';
import type { PlatformIntent } from '@/lib/profile/types';
import { completeOnboarding } from '@/lib/upeer-api';
import { cn } from '@/lib/cn';

function shortenAddress(address: string) {
  if (address.length < 12) {
    return address;
  }
  return `${address.slice(0, 4)}…${address.slice(-4)}`;
}

function OnboardingShell({
  children,
  className,
  role,
}: {
  children: React.ReactNode;
  className?: string;
  role?: React.AriaRole;
}) {
  return (
    <div
      role={role}
      className={cn('ui-card px-5 py-5 sm:px-6 sm:py-6', className)}
    >
      {children}
    </div>
  );
}

export function OnboardingFlow() {
  const router = useRouter();
  const errorId = useId();
  const displayNameId = 'merchant-display-name';
  const displayNameRef = useRef<HTMLInputElement>(null);
  const roleGroupRef = useRef<HTMLDivElement>(null);
  const { openLoginModal } = usePollar();

  const { profile, refreshProfile, status: sessionStatus, syncWithPollar } =
    useUpeerSession();

  const [step, setStep] = useState<OnboardingStep>(1);
  const [intent, setIntent] = useState<PlatformIntent | null>(null);
  const [displayName, setDisplayName] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (sessionStatus !== 'ready' || !profile) {
      return;
    }
    setIntent((prev) => prev ?? profile.platformIntent);
    setDisplayName((prev) => prev || profile.displayName || '');
  }, [sessionStatus, profile]);

  const selectedRole = intent ? roleOptionForIntent(intent) : undefined;
  const needsMerchantName = intent === 'merchant' || intent === 'both';

  const selectIntent = useCallback((next: PlatformIntent) => {
    setIntent(next);
    setError(null);
  }, []);

  const handleRoleKeyDown = useCallback(
    (event: React.KeyboardEvent<HTMLButtonElement>, index: number) => {
      const last = ONBOARDING_ROLE_OPTIONS.length - 1;
      if (event.key === 'ArrowDown' || event.key === 'ArrowRight') {
        event.preventDefault();
        const next = ONBOARDING_ROLE_OPTIONS[(index + 1) % ONBOARDING_ROLE_OPTIONS.length];
        selectIntent(next.intent);
      } else if (event.key === 'ArrowUp' || event.key === 'ArrowLeft') {
        event.preventDefault();
        const next =
          ONBOARDING_ROLE_OPTIONS[index === 0 ? last : index - 1];
        selectIntent(next.intent);
      } else if (event.key === ' ' || event.key === 'Enter') {
        event.preventDefault();
        selectIntent(ONBOARDING_ROLE_OPTIONS[index].intent);
      }
    },
    [selectIntent],
  );

  function goToDetails() {
    if (!intent) {
      setError('Choose how you want to use upeer, then continue.');
      roleGroupRef.current?.focus();
      return;
    }
    setError(null);
    setStep(2);
    requestAnimationFrame(() => displayNameRef.current?.focus());
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (!intent) {
      setStep(1);
      setError('Choose how you want to use upeer, then try again.');
      return;
    }
    if (needsMerchantName && displayName.trim().length < 2) {
      setError(
        'Add a public merchant name (at least 2 characters), then submit again.',
      );
      displayNameRef.current?.focus();
      return;
    }

    setBusy(true);
    setError(null);
    try {
      const trimmedName = displayName.trim();
      const { redirectTo } = await completeOnboarding({
        platformIntent: intent,
        displayName: needsMerchantName
          ? trimmedName
          : trimmedName.length >= 2
            ? trimmedName
            : undefined,
      });
      await refreshProfile();
      router.replace(redirectTo);
    } catch (err) {
      setError(
        err instanceof Error
          ? `${err.message} Check your connection and try again.`
          : 'Could not save your preferences. Check your connection and try again.',
      );
    } finally {
      setBusy(false);
    }
  }

  if (sessionStatus === 'syncing') {
    return (
      <OnboardingShell>
        <div role="status" aria-live="polite" className="space-y-3 py-4">
          <div className="h-2 w-2/3 max-w-xs animate-pulse rounded-full bg-[var(--fill)]" />
          <CardTitle>Connecting your wallet…</CardTitle>
          <CardDescription>
            Linking your Pollar session to upeer. This usually takes a few seconds.
          </CardDescription>
        </div>
      </OnboardingShell>
    );
  }

  if (sessionStatus === 'anonymous') {
    return (
      <OnboardingShell className="space-y-5">
        <div>
          <CardTitle>Sign in to continue</CardTitle>
          <CardDescription className="mt-2">
            Connect with Pollar to link your Stellar wallet, then finish setup here.
          </CardDescription>
        </div>
        <Button type="button" onClick={() => openLoginModal()}>
          Login with Pollar
        </Button>
      </OnboardingShell>
    );
  }

  if (sessionStatus === 'error') {
    return (
      <OnboardingShell className="border-red-500/35" role="alert">
        <CardTitle className="text-red-800 dark:text-red-200">
          Connection failed
        </CardTitle>
        <CardDescription className="mt-2">
          We could not link your wallet to upeer. Retry the connection, or sign
          out and sign in again.
        </CardDescription>
        <Button
          type="button"
          variant="secondary"
          className="mt-5"
          onClick={() => void syncWithPollar()}
        >
          Retry connection
        </Button>
      </OnboardingShell>
    );
  }

  return (
    <div className="space-y-5">
      {profile?.stellarAddress ? (
        <div
          className="flex flex-wrap items-center justify-between gap-3 rounded-[var(--radius-ui)] border border-[var(--line)] bg-[color-mix(in_srgb,var(--fill)_55%,var(--surface))] px-4 py-3"
        >
          <p className="text-xs font-medium uppercase tracking-[0.14em] text-[var(--foreground-tertiary)]">
            Connected wallet
          </p>
          <p
            className="min-w-0 truncate font-mono text-sm text-[var(--foreground)]"
            translate="no"
            title={profile.stellarAddress}
          >
            {shortenAddress(profile.stellarAddress)}
          </p>
        </div>
      ) : null}

      <form
        onSubmit={handleSubmit}
        className="ui-card flex flex-col px-5 py-5 sm:px-6 sm:py-6"
        noValidate
      >
        <OnboardingStepNav step={step} />

        {step === 1 ? (
          <div className="mt-6 space-y-6">
            <div>
              <h2 className="text-sm font-medium text-[var(--foreground)]">
                How will you use upeer?
              </h2>
              <p className="mt-1 text-xs leading-relaxed text-[var(--foreground-tertiary)] text-pretty">
                You can change this later in Account settings.
              </p>
            </div>

            <div className="flex flex-col">
              <div
                ref={roleGroupRef}
                tabIndex={-1}
                className="grid gap-5 sm:grid-cols-3 sm:gap-5"
                role="radiogroup"
                aria-label="Platform role"
                aria-describedby={error && !intent ? errorId : undefined}
              >
                {ONBOARDING_ROLE_OPTIONS.map((option, index) => (
                  <RoleOption
                    key={option.intent}
                    config={option}
                    selected={intent === option.intent}
                    tabIndex={
                      (intent ?? ONBOARDING_ROLE_OPTIONS[0].intent) ===
                      option.intent
                        ? 0
                        : -1
                    }
                    onSelect={() => selectIntent(option.intent)}
                    onKeyDown={(event) => handleRoleKeyDown(event, index)}
                  />
                ))}
              </div>

              {selectedRole ? (
                <div
                  className="mt-6 rounded-[var(--radius-ui)] border border-[var(--line)] bg-[var(--fill)] px-4 py-4 sm:mt-7 sm:px-5 sm:py-4"
                  aria-live="polite"
                >
                  <p className="px-0.5 text-[0.6875rem] font-medium uppercase tracking-[0.12em] text-[var(--foreground-tertiary)]">
                    What you get
                  </p>
                  <ul
                    className="mt-3 grid list-none gap-3 p-0 sm:mt-3.5 sm:grid-cols-3 sm:gap-4 sm:gap-y-3"
                  >
                    {selectedRole.bullets.map((item) => (
                      <li
                        key={item}
                        className="flex items-start gap-2 px-0.5 text-[0.8125rem] leading-snug text-[var(--foreground-secondary)] text-pretty sm:text-sm sm:leading-relaxed"
                      >
                        <span
                          className="mt-[0.4rem] h-1.5 w-1.5 shrink-0 rounded-full bg-[var(--accent)]"
                          aria-hidden="true"
                        />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              ) : (
                <p className="mt-6 px-0.5 py-1 text-sm text-[var(--foreground-tertiary)] text-pretty sm:mt-7">
                  Select a role to see what&apos;s included.
                </p>
              )}
            </div>

            {error && step === 1 ? (
              <p
                id={errorId}
                className="text-sm text-red-800 dark:text-red-200"
                role="alert"
              >
                {error}
              </p>
            ) : null}

            <div className="flex flex-col gap-3 border-t border-[var(--line)] pt-6 sm:flex-row sm:items-center sm:justify-end">
              <Button
                type="button"
                size="lg"
                disabled={!intent}
                className="sm:min-w-[10rem]"
                onClick={goToDetails}
              >
                Continue
              </Button>
            </div>
          </div>
        ) : null}

        {step === 2 && intent && selectedRole ? (
          <div className="mt-6 space-y-5">
            <div
              className="flex flex-wrap items-center gap-3 rounded-[var(--radius-ui)] border border-[var(--accent)]/35 bg-[color-mix(in_srgb,var(--accent)_10%,var(--surface))] px-4 py-3"
            >
              <span
                aria-hidden="true"
                className="flex h-10 w-10 items-center justify-center rounded-[0.65rem] bg-[var(--accent)] text-sm font-semibold text-[var(--accent-ink)]"
              >
                {selectedRole.glyph}
              </span>
              <div className="min-w-0">
                <p className="text-sm font-medium text-[var(--foreground)]">
                  {selectedRole.title}
                </p>
                <p className="text-xs text-[var(--foreground-secondary)] text-pretty">
                  {selectedRole.description}
                </p>
              </div>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="ml-auto"
                onClick={() => {
                  setStep(1);
                  setError(null);
                }}
              >
                Change
              </Button>
            </div>

            <div>
              <label htmlFor={displayNameId} className="field-label">
                {needsMerchantName ? 'Merchant display name' : 'Display name'}
              </label>
              <p className="mt-1 text-xs leading-relaxed text-[var(--foreground-tertiary)] text-pretty">
                {needsMerchantName
                  ? 'Shown to buyers on offers and quotes. Required for selling.'
                  : 'Optional. Shown in the menu instead of your wallet address.'}
              </p>
              <input
                ref={displayNameRef}
                id={displayNameId}
                name="displayName"
                type="text"
                autoComplete="nickname"
                spellCheck={false}
                maxLength={80}
                required={needsMerchantName}
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder={
                  needsMerchantName ? 'e.g. Andes Liquidity' : 'e.g. María'
                }
                aria-invalid={Boolean(error && needsMerchantName)}
                className="field-input mt-3"
              />
            </div>

            <p className="text-xs leading-relaxed text-[var(--foreground-tertiary)] text-pretty">
              After you finish, we&apos;ll take you to the exchange to get your first
              quote. Payout and payment methods live in Account when you&apos;re ready.
            </p>

            {error ? (
              <p
                id={errorId}
                className="text-sm text-red-800 dark:text-red-200"
                role="alert"
                aria-live="polite"
              >
                {error}
              </p>
            ) : null}

            <div className="flex flex-col-reverse gap-3 border-t border-[var(--line)] pt-5 sm:flex-row sm:items-center sm:justify-between">
              <Button
                type="button"
                variant="ghost"
                onClick={() => {
                  setStep(1);
                  setError(null);
                }}
              >
                Back
              </Button>
              <Button
                type="submit"
                size="lg"
                disabled={busy}
                aria-busy={busy}
                className="sm:min-w-[10rem]"
              >
                {onboardingSubmitLabel(busy, true)}
              </Button>
            </div>
          </div>
        ) : null}
      </form>
    </div>
  );
}
