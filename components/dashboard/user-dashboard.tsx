'use client';

import Link from 'next/link';
import { CopyWalletButton } from '@/components/dashboard/copy-wallet-button';
import { PollarRequired } from '@/components/pollar-required';
import { useUpeerSession } from '@/components/session/upeer-session-provider';
import {
  Card,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { ScreenHeader } from '@/components/ui/screen-header';
import {
  buildSetupItems,
  primaryCtaForIntent,
} from '@/lib/dashboard/setup-progress';
import { merchantNavItems, roleLabel } from '@/lib/nav/user-links';
import type { MeProfile } from '@/lib/profile/types';

function statusLine(profile: MeProfile) {
  const methods = profile.paymentPrefs.methods.length;
  const name = profile.displayName?.trim() || 'Not set';
  const payout = profile.payoutAddress ? 'Set' : 'Not set';
  return [
    { label: 'Name', value: name },
    { label: 'How you use upeer', value: roleLabel(profile.platformIntent) ?? '—' },
    { label: 'Payment methods', value: methods === 0 ? 'None yet' : String(methods) },
    { label: 'Payout', value: payout },
  ];
}

function UserDashboardInner() {
  const { profile, status } = useUpeerSession();

  if (status === 'syncing') {
    return (
      <p className="text-sm text-[var(--foreground-secondary)]" role="status" aria-live="polite">
        Loading your account…
      </p>
    );
  }

  if (!profile?.platformIntent) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Finish setup</CardTitle>
          <CardDescription>
            Choose how you use upeer, then this page will show what is ready.
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

  const setupItems = buildSetupItems(profile).filter((item) => item.status === 'action');
  const primary = primaryCtaForIntent(profile.platformIntent);
  const merchant = merchantNavItems(profile).length > 0;
  const rows = statusLine(profile);

  return (
    <div>
      <ScreenHeader
        title={merchant ? 'Performance' : 'Ready to exchange'}
        description={
          merchant
            ? 'A quiet view of what is set up. Posting and matching happen in Market and Orders.'
            : 'Your account is connected. Start from Market — this page stays out of the way.'
        }
        action={
          <Link href={primary.href} className="btn-primary">
            {primary.label}
          </Link>
        }
      />

      <dl className="ui-card divide-y divide-[var(--line)]">
        {rows.map((row) => (
          <div
            key={row.label}
            className="flex items-baseline justify-between gap-4 px-5 py-4 sm:px-6"
          >
            <dt className="exchange-kicker">{row.label}</dt>
            <dd className="text-sm font-medium text-right">{row.value}</dd>
          </div>
        ))}
      </dl>

      {setupItems.length > 0 ? (
        <section className="mt-8">
          <h2 className="text-sm font-medium">Still needed</h2>
          <ul className="mt-3 space-y-2">
            {setupItems.map((item) => (
              <li
                key={item.id}
                className="flex flex-wrap items-baseline justify-between gap-2 border-b border-[var(--line)] py-3 last:border-b-0"
              >
                <div className="min-w-0 max-w-lg">
                  <p className="text-sm">{item.title}</p>
                  <p className="mt-1 text-xs text-[var(--foreground-secondary)] text-pretty">
                    {item.description}
                  </p>
                </div>
                {item.href && item.hrefLabel ? (
                  <Link
                    href={item.href}
                    className="text-sm font-medium text-[var(--accent)] hover:text-[var(--accent-hover)]"
                  >
                    {item.hrefLabel}
                  </Link>
                ) : null}
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      <section className="mt-8">
        <h2 className="text-sm font-medium">Wallet</h2>
        <p className="mt-1 text-sm text-[var(--foreground-secondary)] text-pretty">
          Used to sign in. Counterparties see your name, not this address.
        </p>
        <div className="mt-4 flex flex-wrap items-center gap-2">
          <code
            className="min-w-0 flex-1 truncate rounded-[var(--radius-ui)] border border-[var(--line)] bg-[var(--surface)] px-3 py-2 font-mono text-xs"
            translate="no"
          >
            {profile.stellarAddress}
          </code>
          <CopyWalletButton address={profile.stellarAddress} />
        </div>
        <p className="mt-4 text-sm text-[var(--foreground-tertiary)]">
          Balances and funding live in{' '}
          <Link href="/wallet" className="font-medium text-[var(--accent)] hover:underline">
            Wallet
          </Link>
          .
        </p>
      </section>
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
