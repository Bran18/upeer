'use client';

import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useCallback } from 'react';
import { ProfileSettingsForm } from '@/components/settings/profile-settings-form';
import { PollarRequired } from '@/components/pollar-required';
import { FiatPaymentSettingsForm } from '@/components/settings/fiat-payment-settings-form';
import { PayoutSettingsForm } from '@/components/settings/payout-settings-form';
import { useUpeerSession } from '@/components/session/upeer-session-provider';
import { ScreenHeader } from '@/components/ui/screen-header';
import { onboardingComplete } from '@/lib/profile/types';
import { cn } from '@/lib/cn';

export const SETTINGS_TABS = [
  { id: 'profile', label: 'Identity' },
  { id: 'payout', label: 'Payout' },
  { id: 'fiat', label: 'Payments' },
] as const;

export type SettingsTabId = (typeof SETTINGS_TABS)[number]['id'];

const COPY: Record<
  SettingsTabId,
  { title: string; description: string }
> = {
  profile: {
    title: 'Identity',
    description:
      'Name, photo, and whether you buy, sell, or both. Counterparties see this — not your wallet.',
  },
  payout: {
    title: 'Payout',
    description: 'Where USDC should land when you sell.',
  },
  fiat: {
    title: 'Payments',
    description: 'How you send and receive local currency.',
  },
};

function SettingsInner() {
  const searchParams = useSearchParams();
  const tabParam = searchParams.get('tab');
  const tab: SettingsTabId = SETTINGS_TABS.some((t) => t.id === tabParam)
    ? (tabParam as SettingsTabId)
    : 'profile';

  const { profile, status } = useUpeerSession();
  const tabHref = useCallback((id: SettingsTabId) => `/settings?tab=${id}`, []);

  if (status === 'syncing') {
    return (
      <p className="text-sm text-[var(--foreground-secondary)]" role="status" aria-live="polite">
        Loading your account…
      </p>
    );
  }

  if (!profile) {
    return (
      <div>
        <ScreenHeader
          title="Identity"
          description="Sign in to manage how you appear on upeer."
        />
      </div>
    );
  }

  const onboarded = onboardingComplete(profile);
  const copy = COPY[tab];

  return (
    <div>
      <ScreenHeader title={copy.title} description={copy.description} />

      <div className="site-header-bar mb-6 inline-flex max-w-full">
        <nav className="flex min-w-0 items-center" aria-label="Account sections">
          {SETTINGS_TABS.map((item) => {
            const active = tab === item.id;
            return (
              <Link
                key={item.id}
                href={tabHref(item.id)}
                className={cn('nav-pill', active && 'nav-pill--active')}
                aria-current={active ? 'page' : undefined}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>
      </div>

      <div className="ui-card px-5 py-6 sm:px-6">
        {tab === 'profile' ? <ProfileSettingsForm /> : null}
        {tab === 'payout' ? (
          onboarded ? (
            <PayoutSettingsForm />
          ) : (
            <p className="text-sm text-[var(--foreground-secondary)] text-pretty">
              Complete{' '}
              <Link href="/onboarding" className="font-medium text-[var(--accent)] hover:underline">
                setup
              </Link>{' '}
              before setting a payout address.
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
                setup
              </Link>{' '}
              before adding payment methods.
            </p>
          )
        ) : null}
      </div>

      <p className="mt-6 text-sm text-[var(--foreground-tertiary)]">
        <Link href="/account" className="font-medium text-[var(--accent)] hover:underline">
          ← Account
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
