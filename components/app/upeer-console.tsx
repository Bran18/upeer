'use client';

import { WalletButton, usePollar } from '@pollar/react';
import { useUpeerSession } from '@/components/session/upeer-session-provider';
import { IntegrationsPanel } from '@/components/app/integrations-panel';
import { SwapPanel } from '@/components/app/swap-panel';
import { PollarRequired } from '@/components/pollar-required';

export function UpeerConsole() {
  return (
    <PollarRequired>
      <UpeerConsoleInner />
    </PollarRequired>
  );
}

function UpeerConsoleInner() {
  const { isAuthenticated, verified, wallet, openEnabledAssetsModal } =
    usePollar();
  const {
    status: upeerStatus,
    upeerSession,
    profile,
    error,
    syncWithPollar,
    signOut,
  } = useUpeerSession();

  return (
    <div className="space-y-8">
      <section className="surface-card p-6 sm:p-8">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-caption font-medium uppercase tracking-widest">
              Console
            </p>
            <h1 className="text-title-2 mt-2 text-[1.75rem]">Developer console</h1>
            <p className="text-body mt-2 text-sm">
              Pollar wallet, Reflector references, Trustless Work escrow, and
              Soroswap swaps (testnet).
            </p>
          </div>
          <WalletButton />
        </div>
        <dl className="mt-6 grid gap-3 text-sm sm:grid-cols-2">
          <div>
            <dt className="text-[var(--foreground-secondary)]">Pollar</dt>
            <dd>
              {isAuthenticated
                ? verified
                  ? 'Authenticated'
                  : 'Verifying session…'
                : 'Signed out'}
            </dd>
          </div>
          <div>
            <dt className="text-[var(--foreground-secondary)]">Wallet</dt>
            <dd className="font-mono text-xs">
              {wallet?.address ?? '—'}
            </dd>
          </div>
          <div>
            <dt className="text-[var(--foreground-secondary)]">UPEER profile</dt>
            <dd>
              {profile?.platformIntent
                ? `${profile.platformIntent} · synced`
                : upeerSession
                  ? 'Onboarding required'
                  : 'None'}
            </dd>
          </div>
          <div>
            <dt className="text-[var(--foreground-secondary)]">Server session</dt>
            <dd>
              {upeerStatus === 'syncing'
                ? 'Syncing…'
                : upeerSession
                  ? 'Active'
                  : 'None'}
            </dd>
          </div>
        </dl>
        <div className="mt-4 flex flex-wrap gap-2">
          <button
            type="button"
            disabled={!isAuthenticated || !verified || upeerStatus === 'syncing'}
            onClick={() => void syncWithPollar()}
            className="rounded-full bg-[var(--accent)] px-4 py-2 text-sm font-semibold text-[var(--accent-ink)] disabled:opacity-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent)]"
          >
            Refresh session
          </button>
          <button
            type="button"
            disabled={!isAuthenticated}
            onClick={() => openEnabledAssetsModal()}
            className="rounded-full border border-[var(--line)] px-4 py-2 text-sm hover:border-[var(--accent)]/40"
          >
            USDC trustline
          </button>
          <button
            type="button"
            disabled={!isAuthenticated}
            onClick={() => void signOut()}
            className="rounded-full border border-[var(--line)] px-4 py-2 text-sm hover:border-[var(--accent)]/40"
          >
            Sign out
          </button>
        </div>
        {error ? (
          <p className="mt-3 text-sm text-red-700 dark:text-red-300" role="alert">
            {error}
          </p>
        ) : null}
      </section>

      <IntegrationsPanel />
      <SwapPanel disabled={!isAuthenticated || !verified} />
    </div>
  );
}
