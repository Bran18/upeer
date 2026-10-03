'use client';

import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useCallback, useMemo } from 'react';
import { ProfileSettingsForm } from '@/components/settings/profile-settings-form';
import { PollarRequired } from '@/components/pollar-required';
import { FiatPaymentSettingsForm } from '@/components/settings/fiat-payment-settings-form';
import { PayoutSettingsForm } from '@/components/settings/payout-settings-form';
import { useUpeerSession } from '@/components/session/upeer-session-provider';
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { UPEER_COVERAGE_BLURB } from '@/lib/fiat/coverage';
import { onboardingComplete } from '@/lib/profile/types';
import { cn } from '@/lib/cn';

export const SETTINGS_TABS = [
  { id: 'profile', label: 'Profile' },
  { id: 'payout', label: 'USDC payout' },
  { id: 'fiat', label: 'Fiat payments' },
] as const;

export type SettingsTabId = (typeof SETTINGS_TABS)[number]['id'];

function SettingsInner() {
  const searchParams = useSearchParams();
  const tabParam = searchParams.get('tab');
  const tab: SettingsTabId = SETTINGS_TABS.some((t) => t.id === tabParam)
    ? (tabParam as SettingsTabId)
    : 'profile';

  const { profile, status } = useUpeerSession();

  const tabHref = useCallback((id: SettingsTabId) => `/settings?tab=${id}`, []);

  const sectionLabel = useMemo(() => {
    switch (tab) {
      case 'profile':
        return 'Profile';
      case 'payout':
        return 'USDC payout';
      case 'fiat':
        return 'Fiat payments';
      default:
        return 'Settings';
    }
  }, [tab]);

  if (status === 'syncing') {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Loading settings…</CardTitle>
          <CardDescription role="status" aria-live="polite">
            Syncing your account.
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  if (!profile) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Sign in required</CardTitle>
          <CardDescription>
            Use Pollar in the header, then open settings again.
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  const onboarded = onboardingComplete(profile);

  return (
    <div className="space-y-0">
      <div className="settings-hero">
        <div className="relative z-[1] max-w-xl">
          <p className="settings-hero-kicker">Configuration</p>
          <h1 className="mt-2 text-2xl font-semibold tracking-tight sm:text-3xl">
            Settings
          </h1>
          <p className="mt-2 text-sm leading-relaxed text-white/85 text-pretty">
            Your name, photo, USDC payout, and fiat rails for{' '}
            {UPEER_COVERAGE_BLURB}. Start on the Profile tab to set how you appear
            in the app.
          </p>
        </div>
        <div className="settings-hero-art" aria-hidden>
          <span className="settings-hero-icon">⚙️</span>
        </div>
      </div>

      <div className="ui-card mt-4 overflow-hidden">
        <nav
          className="flex flex-wrap gap-0.5 border-b border-[var(--line)] px-3 pt-2 sm:px-5"
          aria-label="Settings sections"
        >
          {SETTINGS_TABS.map((item) => {
            const active = tab === item.id;
            return (
              <Link
                key={item.id}
                href={tabHref(item.id)}
                className={cn(
                  '-mb-px border-b-2 px-4 py-3 text-sm font-medium transition-colors',
                  active
                    ? 'border-[var(--accent)] text-[var(--foreground)]'
                    : 'border-transparent text-[var(--foreground-secondary)] hover:border-[var(--line)] hover:text-[var(--foreground)]',
                )}
                aria-current={active ? 'page' : undefined}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="px-5 py-6 sm:px-6">
        <p className="text-xs font-medium uppercase tracking-[0.14em] text-[var(--foreground-tertiary)]">
          {sectionLabel}
        </p>

        <div className="mt-6">
          {tab === 'profile' ? <ProfileSettingsForm /> : null}
          {tab === 'payout' ? (
            onboarded ? (
              <PayoutSettingsForm />
            ) : (
              <p className="text-sm text-[var(--foreground-secondary)] text-pretty">
                Complete{' '}
                <Link href="/onboarding" className="font-medium text-[var(--accent)] hover:underline">
                  onboarding
                </Link>{' '}
                before setting a USDC payout address.
              </p>
            )
          ) : null}
          {tab === 'fiat' ? (
            onboarded ? (
              <FiatPaymentSettingsForm />
            ) : (
              <p className="text-sm text-[var(--foreground-secondary)] text-pretty">
                Complete{' '}
                <Link href="/onboarding" className="font-medium text-[var(--accent)] hover:underline">
                  onboarding
                </Link>{' '}
                before adding fiat payment methods.
              </p>
            )
          ) : null}
        </div>
        </div>
      </div>

      <p className="mt-6 text-sm text-[var(--foreground-tertiary)]">
        <Link href="/dashboard" className="font-medium text-[var(--accent)] hover:underline">
          ← Back to dashboard
        </Link>
      </p>
    </div>
  );
}

export function SettingsView() {
  return (
    <PollarRequired>
      <SettingsInner />
    </PollarRequired>
  );
}
