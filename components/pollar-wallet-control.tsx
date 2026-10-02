'use client';

import { usePollar } from '@pollar/react';
import { hasPollarPublishableKey } from '@/components/pollar-required';
import { useOptionalUpeerSession } from '@/components/session/upeer-session-provider';

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
  const { isAuthenticated, wallet, openLoginModal, logout } = usePollar();
  const upeer = useOptionalUpeerSession();
  const short =
    wallet?.address != null
      ? `${wallet.address.slice(0, 4)}…${wallet.address.slice(-4)}`
      : null;

  if (isAuthenticated && short) {
    return (
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => openLoginModal()}
          className="inline-flex min-h-9 items-center rounded-full bg-[var(--fill)] px-3 font-mono text-[0.75rem] text-[var(--foreground)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent)]"
          aria-label={`Wallet ${short}`}
        >
          {short}
        </button>
        <button
          type="button"
          onClick={() => {
            if (upeer) {
              void upeer.signOut();
            } else {
              logout();
            }
          }}
          className="inline-flex min-h-9 items-center px-1 text-[0.75rem] text-[var(--foreground-secondary)] hover:text-[var(--foreground)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent)] max-[380px]:sr-only"
        >
          Sign out
        </button>
      </div>
    );
  }

  return (
    <button
      type="button"
      onClick={() => openLoginModal()}
      className="inline-flex min-h-9 items-center rounded-full bg-[var(--accent)] px-3.5 text-[0.8125rem] font-medium text-white hover:bg-[var(--accent-hover)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent)]"
    >
      Sign in
    </button>
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

  if (isAuthenticated && wallet?.address) {
    return (
      <p className="text-sm text-[var(--foreground-secondary)]">
        Wallet ready —{' '}
        <code className="font-mono text-xs" translate="no">
          {wallet.address.slice(0, 8)}…
        </code>
      </p>
    );
  }

  return (
    <button type="button" onClick={() => openLoginModal()} className={className}>
      {label}
    </button>
  );
}
