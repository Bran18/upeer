'use client';

import Link from 'next/link';
import { DashboardHero } from '@/components/dashboard/dashboard-hero';
import { ProfilePanel } from '@/components/dashboard/profile-panel';
import { ProfileSettingsForm } from '@/components/dashboard/profile-settings-form';
import { SetupChecklist } from '@/components/dashboard/setup-checklist';
import { PollarRequired } from '@/components/pollar-required';
import { useUpeerSession } from '@/components/session/upeer-session-provider';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  buildSetupItems,
  primaryCtaForIntent,
  setupProgress,
} from '@/lib/dashboard/setup-progress';

function UserDashboardInner() {
  const { profile, status } = useUpeerSession();

  if (status === 'syncing') {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Loading your profile…</CardTitle>
          <CardDescription role="status" aria-live="polite">
            Syncing your wallet and preferences.
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  if (!profile?.platformIntent) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Finish account setup</CardTitle>
          <CardDescription>
            Choose how you trade on UPEER so we can personalize your dashboard.
          </CardDescription>
        </CardHeader>
        <CardFooter>
          <Link href="/onboarding" className="btn-primary">
            Continue setup
          </Link>
        </CardFooter>
      </Card>
    );
  }

  const setupItems = buildSetupItems(profile);
  const progress = setupProgress(setupItems);
  const nextItem =
    setupItems.find((item) => item.status === 'action') ??
    setupItems.find((item) => item.status === 'upcoming') ??
    null;

  const intent = profile.platformIntent;
  const primary = primaryCtaForIntent(intent);
  const showBuyer = intent === 'buyer' || intent === 'both';
  const showMerchant = intent === 'merchant' || intent === 'both';
  const secondary = showMerchant
    ? { href: '/merchant', label: 'Merchant desk' }
    : showBuyer
      ? { href: '/market', label: 'OTC market' }
      : null;

  return (
    <div className="space-y-8">
      <DashboardHero profile={profile} progress={progress} nextItem={nextItem} />

      <section aria-label="Shortcuts" className="grid gap-3 sm:grid-cols-2">
        <Link
          href={primary.href}
          className="ui-card group flex min-h-[5.5rem] flex-col justify-between p-4 transition-[border-color,transform] duration-200 hover:border-[var(--accent)] hover:-translate-y-0.5 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent)]"
        >
          <p className="text-sm font-medium">{primary.label}</p>
          <p className="mt-1 text-xs text-[var(--foreground-secondary)] text-pretty">
            {primary.description}
          </p>
          <span className="mt-3 text-xs font-medium text-[var(--accent)] group-hover:text-[var(--accent-hover)]">
            Open →
          </span>
        </Link>
        {secondary ? (
          <Link
            href={secondary.href}
            className="ui-card group flex min-h-[5.5rem] flex-col justify-between p-4 transition-[border-color,transform] duration-200 hover:border-[var(--accent)] hover:-translate-y-0.5 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent)]"
          >
            <p className="text-sm font-medium">{secondary.label}</p>
            <p className="mt-1 text-xs text-[var(--foreground-secondary)] text-pretty">
              {secondary.href === '/merchant'
                ? 'Offers, spreads, and settlement.'
                : 'Live desk quotes and escrow flow.'}
            </p>
            <span className="mt-3 text-xs font-medium text-[var(--accent)] group-hover:text-[var(--accent-hover)]">
              Open →
            </span>
          </Link>
        ) : null}
      </section>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(18rem,22rem)] lg:items-start">
        <SetupChecklist items={setupItems} />
        <ProfilePanel profile={profile} />
      </div>

      <Card id="settings" className="scroll-mt-[calc(var(--site-header-height)+1rem)]">
        <CardHeader>
          <CardTitle>Settings</CardTitle>
          <CardDescription>
            Update your marketplace role and display name. Changes apply after you
            save.
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-0">
          <ProfileSettingsForm />
        </CardContent>
      </Card>

      <p className="text-sm text-[var(--foreground-tertiary)] text-pretty">
        Protocol integrations (Reflector, Trustless Work, Soroswap) are in{' '}
        <Link
          href="/app"
          className="font-medium text-[var(--accent)] hover:text-[var(--accent-hover)]"
        >
          Developer tools
        </Link>
        .
      </p>
    </div>
  );
}

export function UserDashboard() {
  return (
    <PollarRequired>
      <UserDashboardInner />
    </PollarRequired>
  );
}
