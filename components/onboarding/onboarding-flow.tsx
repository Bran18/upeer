'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { RoleOption, type RoleOptionConfig } from '@/components/onboarding/role-option';
import { useUpeerSession } from '@/components/session/upeer-session-provider';
import type { PlatformIntent } from '@/lib/profile/types';
import { completeOnboarding } from '@/lib/upeer-api';

const ROLE_OPTIONS: RoleOptionConfig[] = [
  {
    intent: 'buyer',
    title: 'Buy USDC',
    description: 'Find verified merchants and lock executable OTC quotes.',
    bullets: [
      'Browse offers in your fiat currency',
      'Settle the digital leg via Trustless Work escrow',
      'Track orders from quote to release',
    ],
  },
  {
    intent: 'merchant',
    title: 'Sell USDC',
    description: 'List inventory, set spreads, and serve buyers on UPEER.',
    bullets: [
      'Apply for verification (testnet is manual)',
      'Publish sell-side offers with Reflector references',
      'Receive USDC leg through escrow milestones',
    ],
  },
  {
    intent: 'both',
    title: 'Buy and Sell',
    description: 'Operate on both sides of the marketplace.',
    bullets: [
      'Console for liquidity tools and Soroswap funding',
      'Merchant tools plus buyer market access',
      'One wallet, one profile across flows',
    ],
  },
];

export function OnboardingFlow() {
  const router = useRouter();
  const { profile, refreshProfile, status: sessionStatus } = useUpeerSession();
  const [intent, setIntent] = useState<PlatformIntent | null>(
    profile?.platformIntent ?? null,
  );
  const [displayName, setDisplayName] = useState(profile?.displayName ?? '');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const needsMerchantName =
    intent === 'merchant' || intent === 'both';

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (!intent) {
      setError('Choose how you want to use UPEER.');
      return;
    }
    if (needsMerchantName && displayName.trim().length < 2) {
      setError('Add a public merchant name (at least 2 characters).');
      return;
    }

    setBusy(true);
    setError(null);
    try {
      const { redirectTo } = await completeOnboarding({
        platformIntent: intent,
        displayName: needsMerchantName ? displayName.trim() : undefined,
      });
      await refreshProfile();
      router.replace(redirectTo);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Could not save your preferences',
      );
    } finally {
      setBusy(false);
    }
  }

  if (sessionStatus === 'syncing') {
    return (
      <p className="text-body text-sm" aria-live="polite">
        Connecting your wallet to UPEER…
      </p>
    );
  }

  if (sessionStatus === 'anonymous') {
    return (
      <p className="text-body text-sm">
        Use <strong>Login with Pollar</strong> in the header, then return here.
      </p>
    );
  }

  if (sessionStatus === 'error') {
    return (
      <p className="text-sm text-red-700 dark:text-red-300" role="alert">
        We could not link your account. Use <strong>Retry connection</strong> in
        the banner above, or sign out and sign in again.
      </p>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      <fieldset>
        <legend className="text-headline text-sm">
          How will you use UPEER?
        </legend>
        <div
          className="mt-4 grid gap-3 sm:grid-cols-1"
          role="radiogroup"
          aria-label="Platform role"
        >
          {ROLE_OPTIONS.map((option) => (
            <RoleOption
              key={option.intent}
              config={option}
              selected={intent === option.intent}
              onSelect={() => setIntent(option.intent)}
            />
          ))}
        </div>
      </fieldset>

      {needsMerchantName ? (
        <div>
          <label
            htmlFor="merchant-display-name"
            className="text-headline block text-sm"
          >
            Merchant display name
          </label>
          <p className="text-body mt-1 text-sm">
            Shown to buyers on offers and quotes.
          </p>
          <input
            id="merchant-display-name"
            name="displayName"
            type="text"
            autoComplete="organization"
            spellCheck={false}
            maxLength={80}
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            placeholder="e.g. Andes Liquidity…"
            className="mt-2 w-full min-h-[44px] rounded-xl border border-[var(--line)] bg-[var(--background-secondary)] px-3 py-2 text-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent)]"
          />
        </div>
      ) : null}

      {error ? (
        <p
          className="text-sm text-red-700 dark:text-red-300"
          role="alert"
          aria-live="polite"
        >
          {error}
        </p>
      ) : null}

      <button
        type="submit"
        disabled={busy || !intent}
        className="min-h-[44px] rounded-full bg-[var(--accent)] px-6 py-2.5 text-sm font-medium text-[var(--accent-ink)] hover:bg-[var(--accent-hover)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent)] disabled:cursor-not-allowed disabled:opacity-40"
      >
        {busy ? 'Saving…' : 'Continue to UPEER'}
      </button>
    </form>
  );
}
