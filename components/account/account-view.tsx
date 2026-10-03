'use client';

import Link from 'next/link';
import { PollarRequired } from '@/components/pollar-required';
import { useUpeerSession } from '@/components/session/upeer-session-provider';
import { Card, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { merchantNavItems } from '@/lib/nav/user-links';

const ACCOUNT_AREAS = [
  {
    href: '/settings?tab=profile',
    title: 'Identity',
    body: 'Name, photo, and how you appear to counterparties.',
  },
  {
    href: '/settings?tab=fiat',
    title: 'Payment methods',
    body: 'How you send and receive local currency.',
  },
  {
    href: '/wallet',
    title: 'Wallet',
    body: 'Balances, receive details, and send USDC or XLM.',
  },
  {
    href: '/settings?tab=payout',
    title: 'Payout address',
    body: 'Where USDC should land when you sell.',
  },
] as const;

function AccountInner() {
  const { profile, status } = useUpeerSession();

  if (status === 'syncing') {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Loading account…</CardTitle>
          <CardDescription role="status" aria-live="polite">
            Syncing your profile.
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  const merchant = merchantNavItems(profile);

  return (
    <div className="space-y-8">
      <header className="max-w-lg">
        <h1 className="text-[clamp(1.85rem,5vw,2.5rem)] font-medium tracking-[-0.04em]">
          Account
        </h1>
        <p className="mt-3 text-sm leading-relaxed text-[var(--foreground-secondary)] text-pretty">
          Identity, payment methods, wallet, and preferences — kept together so
          exchange stays simple.
        </p>
      </header>

      <div className="grid gap-3 sm:grid-cols-2">
        {ACCOUNT_AREAS.map((area) => (
          <Link
            key={area.href}
            href={area.href}
            className="ui-card group flex min-h-[7rem] flex-col justify-between p-5 transition-[border-color] duration-200 hover:border-[var(--accent)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent)]"
          >
            <div>
              <p className="text-sm font-medium">{area.title}</p>
              <p className="mt-2 text-sm leading-relaxed text-[var(--foreground-secondary)] text-pretty">
                {area.body}
              </p>
            </div>
            <span className="mt-4 text-xs font-medium text-[var(--accent)]">
              Open
            </span>
          </Link>
        ))}
      </div>

      {merchant.length > 0 ? (
        <section>
          <h2 className="text-sm font-medium">Merchant</h2>
          <p className="mt-1 text-sm text-[var(--foreground-secondary)]">
            Operational tools stay out of the main navigation.
          </p>
          <div className="mt-4 grid gap-2 sm:grid-cols-2">
            {merchant.map((item) => (
              <Link
                key={item.href + item.label}
                href={item.href}
                className="rounded-[var(--radius-ui)] border border-[var(--line)] px-4 py-3 text-sm hover:border-[var(--accent)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent)]"
              >
                {item.label}
              </Link>
            ))}
          </div>
        </section>
      ) : null}
    </div>
  );
}

export function AccountView() {
  return (
    <PollarRequired>
      <AccountInner />
    </PollarRequired>
  );
}
