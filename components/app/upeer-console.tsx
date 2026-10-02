'use client';

import { usePollar } from '@pollar/react';
import { PollarWalletControl } from '@/components/pollar-wallet-control';
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
      <section className="panel-card sm:p-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0">
            <p className="text-caption font-medium uppercase tracking-widest">
              Console
            </p>
            <h1 className="text-title-2 mt-2">Developer console</h1>
            <p className="text-body mt-2 text-sm text-pretty">
              Pollar wallet, Reflector references, Trustless Work escrow, and
              Soroswap swaps (testnet).
            </p>
          </div>
          <div className="shrink-0 self-start">
            <PollarWalletControl />
          </div>
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
            <dd className="break-all font-mono text-xs">
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
            className="btn-primary"
          >
            Refresh Session
          </button>
          <button
            type="button"
            disabled={!isAuthenticated}
            onClick={() => openEnabledAssetsModal()}
            className="btn-secondary"
          >
            USDC Trustline
          </button>
          <button
            type="button"
            disabled={!isAuthenticated}
            onClick={() => void signOut()}
            className="btn-secondary"
          >
            Sign Out
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
