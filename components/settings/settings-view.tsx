'use client';

import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useCallback, useMemo } from 'react';
import { ProfileSettingsForm } from '@/components/dashboard/profile-settings-form';
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

  if (!profile?.platformIntent) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Finish setup first</CardTitle>
          <CardDescription>
            Complete onboarding before changing payment and profile settings.
          </CardDescription>
        </CardHeader>
        <p className="px-6 pb-6">
          <Link href="/onboarding" className="btn-primary">
            Continue setup
          </Link>
        </p>
      </Card>
    );
  }

  return (
    <div className="space-y-0">
      <div className="settings-hero">
        <div className="relative z-[1] max-w-xl">
          <p className="settings-hero-kicker">Configuration</p>
          <h1 className="mt-2 text-2xl font-semibold tracking-tight sm:text-3xl">
            Settings
          </h1>
          <p className="mt-2 text-sm leading-relaxed text-white/85 text-pretty">
            Profile, USDC payout, and fiat payment details for{' '}
            {UPEER_COVERAGE_BLURB}. Your dashboard is for trading shortcuts only.
          </p>
        </div>
        <div className="settings-hero-art" aria-hidden>
          <span className="settings-hero-icon">⚙️</span>
        </div>
      </div>

      <div className="mt-4 flex flex-wrap gap-1 border-b border-[var(--line)] pb-px">
        {SETTINGS_TABS.map((item) => (
          <Link
            key={item.id}
            href={tabHref(item.id)}
            className={cn(
              'rounded-t-[var(--radius-ui)] px-4 py-2.5 text-sm font-medium transition-colors',
              tab === item.id
                ? 'bg-[var(--surface-elevated)] text-[var(--foreground)] shadow-[inset_0_-1px_0_var(--surface-elevated)]'
                : 'text-[var(--foreground-secondary)] hover:text-[var(--foreground)]',
            )}
            aria-current={tab === item.id ? 'page' : undefined}
          >
            {item.label}
          </Link>
        ))}
      </div>

      <div className="ui-card rounded-t-none border-t-0 px-5 py-6 sm:px-6">
        <p className="text-xs font-medium uppercase tracking-[0.14em] text-[var(--foreground-tertiary)]">
          {sectionLabel}
        </p>

        <div className="mt-6">
          {tab === 'profile' ? <ProfileSettingsForm /> : null}
          {tab === 'payout' ? <PayoutSettingsForm /> : null}
          {tab === 'fiat' ? <FiatPaymentSettingsForm /> : null}
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
