'use client';

import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useId, useRef, useState } from 'react';
import { RoleOption } from '@/components/onboarding/role-option';
import { useUpeerSession } from '@/components/session/upeer-session-provider';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  ONBOARDING_ROLE_OPTIONS,
  onboardingSubmitLabel,
} from '@/lib/onboarding/role-options';
import type { PlatformIntent } from '@/lib/profile/types';
import { completeOnboarding } from '@/lib/upeer-api';

function shortenAddress(address: string) {
  if (address.length < 12) {
    return address;
  }
  return `${address.slice(0, 4)}…${address.slice(-4)}`;
}

export function OnboardingFlow() {
  const router = useRouter();
  const errorId = useId();
  const displayNameId = 'merchant-display-name';
  const displayNameRef = useRef<HTMLInputElement>(null);
  const roleGroupRef = useRef<HTMLDivElement>(null);

  const { profile, refreshProfile, status: sessionStatus, syncWithPollar } =
    useUpeerSession();

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

  const needsMerchantName = intent === 'merchant' || intent === 'both';
  const showDisplayName = intent != null;
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

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (!intent) {
      setError('Choose how you want to use upeer, then try again.');
      roleGroupRef.current?.focus();
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
      <Card role="status" aria-live="polite">
        <CardHeader>
          <CardTitle>Connecting your wallet…</CardTitle>
          <CardDescription>
            Linking your Pollar session to upeer. This usually takes a few seconds.
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  if (sessionStatus === 'anonymous') {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Sign in to continue</CardTitle>
          <CardDescription>
            Use <strong>Login with Pollar</strong> in the header, then return to
            this page to finish setup.
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  if (sessionStatus === 'error') {
    return (
      <Card className="border-red-500/35" role="alert">
        <CardHeader>
          <CardTitle className="text-red-800 dark:text-red-200">
            Connection failed
          </CardTitle>
          <CardDescription>
            We could not link your wallet to upeer. Retry the connection, or sign
            out and sign in again.
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-0">
          <Button
            type="button"
            variant="secondary"
            onClick={() => void syncWithPollar()}
          >
            Retry connection
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-8">
      {profile?.stellarAddress ? (
        <Card>
          <CardContent className="flex min-w-0 flex-col gap-1 py-4 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-xs font-medium uppercase tracking-[0.14em] text-[var(--foreground-tertiary)]">
              Connected wallet
            </p>
            <p
              className="min-w-0 truncate font-mono text-sm"
              translate="no"
              title={profile.stellarAddress}
            >
              {shortenAddress(profile.stellarAddress)}
            </p>
          </CardContent>
        </Card>
      ) : null}

      <form onSubmit={handleSubmit} className="space-y-6" noValidate>
        <fieldset className="m-0 border-0 p-0">
          <legend className="sr-only">How you will use upeer</legend>
          <p className="text-[0.6875rem] font-medium uppercase tracking-[0.22em] text-[var(--foreground-tertiary)]">
            Step 1 — Choose your role
          </p>
          <div
            ref={roleGroupRef}
            tabIndex={-1}
            className="mt-4 grid gap-3"
            role="radiogroup"
            aria-label="Platform role"
            aria-describedby={error && !intent ? errorId : undefined}
          >
            {ONBOARDING_ROLE_OPTIONS.map((option, index) => (
              <RoleOption
                key={option.intent}
                config={option}
                selected={intent === option.intent}
                tabIndex={intent === option.intent ? 0 : -1}
                onSelect={() => selectIntent(option.intent)}
                onKeyDown={(event) => handleRoleKeyDown(event, index)}
              />
            ))}
          </div>
        </fieldset>

        {showDisplayName ? (
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Step 2 — Your name</CardTitle>
              <CardDescription>
                {needsMerchantName
                  ? 'Shown to buyers on offers and quotes.'
                  : 'Optional. Shown in the header menu instead of your wallet address.'}
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-0">
              <label htmlFor={displayNameId} className="field-label">
                {needsMerchantName ? 'Merchant display name' : 'Display name'}
              </label>
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
                  needsMerchantName ? 'e.g. Andes Liquidity…' : 'e.g. María'
                }
                aria-invalid={Boolean(error && needsMerchantName)}
                className="field-input"
              />
            </CardContent>
          </Card>
        ) : null}

        <p className="text-body text-sm text-pretty">
          Your role is stored on your profile. After saving, you&apos;ll land on
          your dashboard to finish verification and account settings.
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

        <Button
          type="submit"
          disabled={busy || !intent}
          aria-busy={busy}
          className="w-full sm:w-auto"
        >
          {onboardingSubmitLabel(busy, Boolean(intent))}
        </Button>
      </form>
    </div>
  );
}
