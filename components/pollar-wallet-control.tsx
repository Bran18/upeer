'use client';

import Link from 'next/link';
import { usePollar } from '@pollar/react';
import { useMemo } from 'react';
import { hasPollarPublishableKey } from '@/components/pollar-required';
import { useOptionalUpeerSession } from '@/components/session/upeer-session-provider';
import { Button } from '@/components/ui/button';
import { resolveUserIdentity } from '@/lib/nav/user-links';

export function PollarWalletControl() {
  if (!hasPollarPublishableKey()) {
    return (
      <span className="text-xs text-[var(--foreground-tertiary)]">
        Pollar key missing
      </span>
    );
  }

  return <PollarWalletControlInner />;
}

function PollarWalletControlInner() {
  const {
    isAuthenticated,
    wallet,
    openLoginModal,
    logout,
  } = usePollar();
  const upeer = useOptionalUpeerSession();

  const identity = useMemo(
    () =>
      resolveUserIdentity({
        profile: upeer?.profile,
        sessionStatus: upeer?.status,
        walletAddress:
          upeer?.profile?.stellarAddress ?? wallet?.address ?? null,
      }),
    [upeer?.profile, upeer?.status, wallet?.address],
  );

  if (isAuthenticated) {
    return (
      <div className="flex flex-wrap items-center gap-2">
        {identity.promptDisplayName ? (
          <Link
            href="/settings?tab=profile"
            className="text-sm font-medium text-[var(--accent)] hover:underline"
          >
            {identity.primaryLabel}
          </Link>
        ) : (
          <Link
            href="/wallet"
            className="inline-flex min-h-9 max-w-[12rem] items-center truncate rounded-full bg-[var(--fill)] px-3 text-sm font-medium text-[var(--foreground)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent)]"
            aria-label={`Open wallet for ${identity.primaryLabel}`}
          >
            {identity.primaryLabel}
          </Link>
        )}
        {identity.walletLine ? (
          <span
            className="font-mono text-[0.75rem] text-[var(--foreground-tertiary)]"
            translate="no"
          >
            {identity.walletLine}
          </span>
        ) : null}
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => {
            if (upeer) {
              void upeer.signOut();
            } else {
              logout();
            }
          }}
        >
          Sign out
        </Button>
      </div>
    );
  }

  return (
    <Button type="button" size="sm" onClick={() => openLoginModal()}>
      Sign in
    </Button>
  );
}

export function PollarSignInButton({
  className,
  label = 'Sign in',
}: {
  className?: string;
  label?: string;
}) {
  const { isAuthenticated, wallet, openLoginModal } = usePollar();
  const upeer = useOptionalUpeerSession();

  const identity = useMemo(
    () =>
      resolveUserIdentity({
        profile: upeer?.profile,
        sessionStatus: upeer?.status,
        walletAddress:
          upeer?.profile?.stellarAddress ?? wallet?.address ?? null,
      }),
    [upeer?.profile, upeer?.status, wallet?.address],
  );

  if (isAuthenticated) {
    const name = identity.primaryLabel;
    return (
      <p className="text-sm text-[var(--foreground-secondary)]">
        Signed in as{' '}
        <span className="font-medium text-[var(--foreground)]">{name}</span>
        {identity.walletLine ? (
          <>
            {' '}
            <span className="font-mono text-xs" translate="no">
              ({identity.walletLine})
            </span>
          </>
        ) : null}
      </p>
    );
  }

  return (
    <button type="button" onClick={() => openLoginModal()} className={className}>
      {label}
    </button>
  );
}
