'use client';

import Link from 'next/link';
import { PollarRequired } from '@/components/pollar-required';
import { useUpeerSession } from '@/components/session/upeer-session-provider';
import { Avatar } from '@/components/ui/avatar';
import {
  accountCorridors,
  accountPassCopy,
} from '@/lib/account/pass';
import { merchantNavItems } from '@/lib/nav/user-links';
import { onboardingComplete } from '@/lib/profile/types';
import { cn } from '@/lib/cn';

const DESK_DETAIL: Record<string, string> = {
  '/orders': 'Open and completed trades',
  '/merchant': 'Desk profile and orders',
  '/dashboard': 'Volume and fill stats',
};

function AccountInner() {
  const { profile, status, isOnboarded } = useUpeerSession();

  if (status === 'syncing') {
    return (
      <p className="text-sm text-[var(--foreground-secondary)]" role="status" aria-live="polite">
        Loading your account…
      </p>
    );
  }

  const pass = accountPassCopy(profile);
  const corridors = accountCorridors(profile);
  const merchant = merchantNavItems(profile);
  const setupDone = profile ? onboardingComplete(profile) : isOnboarded;

  return (
    <div className="account-floor">
      <section className="account-pass" aria-labelledby="account-pass-name">
        <div className="account-pass-spine" aria-hidden="true" />
        <div className="account-pass-fold" aria-hidden="true" />

        <div className="account-pass-body">
          <Avatar
            label={pass.name}
            src={profile?.avatarUrl}
            size="pass"
            shape="tile"
          />
          <div className="min-w-0 flex-1">
            <h2 id="account-pass-name" className="account-pass-name text-balance">
              {pass.name}
            </h2>
            <p className="account-pass-role">{pass.role}</p>
            {pass.addressShort ? (
              <p className="account-pass-wallet tabular-nums">{pass.addressShort}</p>
            ) : null}
          </div>
        </div>

        <p className="account-pass-readiness text-pretty">{pass.readiness}</p>

        <div className="account-pass-actions">
          {setupDone ? (
            <Link href="/market" className="btn-primary account-pass-link">
              Open market
            </Link>
          ) : (
            <Link href="/onboarding" className="btn-primary account-pass-link">
              Finish setup
            </Link>
          )}
          <Link href="/settings?tab=profile" className="btn-secondary account-pass-link">
            Edit identity
          </Link>
        </div>
      </section>

      <nav className="account-corridors" aria-label="Account sections">
        {corridors.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              'account-corridor',
              item.tone === 'open' && 'account-corridor--open',
            )}
          >
            <span className="account-corridor-title">{item.title}</span>
            <span className="account-corridor-detail">{item.detail}</span>
          </Link>
        ))}
      </nav>

      {merchant.length > 0 ? (
        <section className="account-desk" aria-labelledby="account-desk-title">
          <h2 id="account-desk-title" className="account-desk-title">
            Seller tools
          </h2>
          <nav className="account-corridors" aria-label="Seller tools">
            {merchant.map((item) => (
              <Link
                key={item.href + item.label}
                href={item.href}
                className="account-corridor"
              >
                <span className="account-corridor-title">{item.label}</span>
                <span className="account-corridor-detail">
                  {DESK_DETAIL[item.href] ?? 'Seller tools'}
                </span>
              </Link>
            ))}
          </nav>
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
