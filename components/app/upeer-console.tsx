'use client';

import { WalletButton, usePollar } from '@pollar/react';
import { useCallback, useEffect, useState } from 'react';
import {
  exchangePollarSession,
  logoutUpeerSession,
  readStoredSession,
} from '@/lib/upeer-api';
import { IntegrationsPanel } from '@/components/app/integrations-panel';
import { SwapPanel } from '@/components/app/swap-panel';
import { PollarRequired } from '@/components/pollar-required';

function pollarAccessToken(
  getClient: ReturnType<typeof usePollar>['getClient'],
): string | null {
  const auth = getClient().getAuthState();
  if (auth.step !== 'authenticated') {
    return null;
  }
  return auth.session.token.accessToken;
}

export function UpeerConsole() {
  return (
    <PollarRequired>
      <UpeerConsoleInner />
    </PollarRequired>
  );
}

function UpeerConsoleInner() {
  const {
    getClient,
    isAuthenticated,
    verified,
    wallet,
    logout,
    openEnabledAssetsModal,
  } = usePollar();
  const [upeerSession, setUpeerSession] = useState(readStoredSession());
  const [status, setStatus] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const syncServerSession = useCallback(async () => {
    const token = pollarAccessToken(getClient);
    if (!token) {
      return;
    }
    setBusy(true);
    setStatus(null);
    try {
      const session = await exchangePollarSession(token);
      setUpeerSession(session);
      setStatus('UPEER server session active.');
    } catch (error) {
      setStatus(
        error instanceof Error ? error.message : 'Could not sync UPEER session',
      );
    } finally {
      setBusy(false);
    }
  }, [getClient]);

  useEffect(() => {
    if (isAuthenticated && verified && !upeerSession) {
      void syncServerSession();
    }
  }, [isAuthenticated, verified, upeerSession, syncServerSession]);

  const handleLogout = async () => {
    await logoutUpeerSession();
    setUpeerSession(null);
    logout();
  };

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
            <dt className="text-zinc-500">UPEER API session</dt>
            <dd>{upeerSession ? 'Active' : 'None'}</dd>
          </div>
        </dl>
        <div className="mt-4 flex flex-wrap gap-2">
          <button
            type="button"
            disabled={!isAuthenticated || !verified || busy}
            onClick={() => void syncServerSession()}
            className="rounded-lg bg-emerald-600 px-3 py-2 text-sm font-medium text-white disabled:opacity-50"
          >
            Sync server session
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
            onClick={() => void handleLogout()}
            className="rounded-lg border border-zinc-300 px-3 py-2 text-sm dark:border-zinc-700"
          >
            Sign out
          </button>
        </div>
        {status ? (
          <p className="mt-3 text-sm text-zinc-600 dark:text-zinc-400">
            {status}
          </p>
        ) : null}
      </section>

      <IntegrationsPanel />
      <SwapPanel disabled={!isAuthenticated || !verified} />
    </div>
  );
}
