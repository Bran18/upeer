'use client';

import { WalletButton, usePollar } from '@pollar/react';
import { hasPollarPublishableKey } from '@/components/pollar-required';

/**
 * Header wallet control — must render inside PollarProvider.
 * WalletButton opens the built-in login modal when logged out.
 */
export function PollarWalletControl() {
  if (!hasPollarPublishableKey()) {
    return (
      <span className="text-xs text-zinc-500">
        Set NEXT_PUBLIC_POLLAR_PUBLISHABLE_KEY
      </span>
    );
  }

  return <WalletButton />;
}

/** Explicit sign-in for hero / CTA sections */
export function PollarSignInButton({
  className,
  label = 'Sign in with Pollar',
}: {
  className?: string;
  label?: string;
}) {
  const { isAuthenticated, wallet, openLoginModal } = usePollar();

  if (isAuthenticated && wallet?.address) {
    return (
      <p className="text-sm text-zinc-600 dark:text-zinc-400">
        Wallet ready —{' '}
        <code className="font-mono text-xs">{wallet.address.slice(0, 8)}…</code>
      </p>
    );
  }

  return (
    <button
      type="button"
      onClick={() => openLoginModal()}
      className={
        className ??
        'rounded-xl bg-[#005DB4] px-5 py-2.5 text-sm font-semibold text-white shadow-sm hover:opacity-90'
      }
    >
      {label}
    </button>
  );
}
