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
      <section className="rounded-xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-xl font-semibold">Developer console</h1>
            <p className="mt-1 text-sm text-zinc-500">
              Pollar wallet, Reflector references, Trustless Work escrow, and
              Soroswap swaps (testnet).
            </p>
          </div>
          <WalletButton />
        </div>
        <dl className="mt-6 grid gap-3 text-sm sm:grid-cols-2">
          <div>
            <dt className="text-zinc-500">Pollar</dt>
            <dd>
              {isAuthenticated
                ? verified
                  ? 'Authenticated'
                  : 'Verifying session…'
                : 'Signed out'}
            </dd>
          </div>
          <div>
            <dt className="text-zinc-500">Wallet</dt>
            <dd className="font-mono text-xs">
              {wallet?.address ?? '—'}
            </dd>
          </div>
          <div>
            <dt className="text-zinc-500">UPEER profile</dt>
            <dd>
              {profile?.platformIntent
                ? `${profile.platformIntent} · synced`
                : upeerSession
                  ? 'Onboarding required'
                  : 'None'}
            </dd>
          </div>
          <div>
            <dt className="text-zinc-500">Server session</dt>
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
            className="rounded-lg bg-emerald-600 px-3 py-2 text-sm font-medium text-white disabled:opacity-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-600"
          >
            Refresh session
          </button>
          <button
            type="button"
            disabled={!isAuthenticated}
            onClick={() => openEnabledAssetsModal()}
            className="rounded-lg border border-zinc-300 px-3 py-2 text-sm dark:border-zinc-700"
          >
            USDC trustline
          </button>
          <button
            type="button"
            disabled={!isAuthenticated}
            onClick={() => void signOut()}
            className="rounded-lg border border-zinc-300 px-3 py-2 text-sm dark:border-zinc-700"
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
