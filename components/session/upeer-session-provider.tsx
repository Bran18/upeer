'use client';

import { usePollar } from '@pollar/react';
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import {
  readPollarAccessToken,
  readPollarWalletHint,
} from '@/lib/pollar/access-token';
import type { MeProfile } from '@/lib/profile/types';
import { onboardingComplete } from '@/lib/profile/types';
import {
  exchangePollarSession,
  fetchMeProfile,
  logoutUpeerSession,
  readStoredSession,
  type UpeerSessionResponse,
} from '@/lib/upeer-api';

export type UpeerSessionStatus =
  | 'anonymous'
  | 'syncing'
  | 'ready'
  | 'error';

type UpeerSessionContextValue = {
  status: UpeerSessionStatus;
  upeerSession: UpeerSessionResponse | null;
  profile: MeProfile | null;
  error: string | null;
  isOnboarded: boolean;
  refreshProfile: () => Promise<void>;
  syncWithPollar: () => Promise<void>;
  signOut: () => Promise<void>;
};

const UpeerSessionContext = createContext<UpeerSessionContextValue | null>(
  null,
);

export function useUpeerSession(): UpeerSessionContextValue {
  const ctx = useContext(UpeerSessionContext);
  if (!ctx) {
    throw new Error('useUpeerSession must be used within UpeerSessionProvider');
  }
  return ctx;
}

export function useOptionalUpeerSession(): UpeerSessionContextValue | null {
  return useContext(UpeerSessionContext);
}

export function UpeerSessionProvider({ children }: { children: ReactNode }) {
  const {
    getClient,
    isAuthenticated,
    verified,
    wallet,
    logout: pollarLogout,
  } = usePollar();
  const [upeerSession, setUpeerSession] = useState<UpeerSessionResponse | null>(
    () => readStoredSession(),
  );
  const [profile, setProfile] = useState<MeProfile | null>(null);
  const [status, setStatus] = useState<UpeerSessionStatus>('anonymous');
  const [error, setError] = useState<string | null>(null);
  const syncInFlight = useRef(false);

  const refreshProfile = useCallback(async () => {
    const me = await fetchMeProfile(
      upeerSession?.accessToken ?? readStoredSession()?.accessToken,
    );
    setProfile(me);
  }, [upeerSession?.accessToken]);

  const syncWithPollar = useCallback(async () => {
    if (syncInFlight.current) {
      return;
    }
    const token = readPollarAccessToken(getClient());
    if (!token) {
      setStatus('anonymous');
      setProfile(null);
      return;
    }

    syncInFlight.current = true;
    setStatus('syncing');
    setError(null);
    try {
      const hint = readPollarWalletHint(getClient());
      const session = await exchangePollarSession(token, {
        stellarAddress: wallet?.address ?? hint.stellarAddress,
        custody: wallet?.custody ?? hint.custody,
      });
      setUpeerSession(session);
      const me = await fetchMeProfile(session.accessToken);
      setProfile(me);
      setStatus('ready');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Session sync failed');
      setStatus('error');
    } finally {
      syncInFlight.current = false;
    }
  }, [getClient, wallet?.address, wallet?.custody]);

  useEffect(() => {
    if (!isAuthenticated) {
      if (verified) {
        setStatus('anonymous');
        setProfile(null);
        setUpeerSession(null);
        setError(null);
      }
      return;
    }

    if (!verified) {
      setStatus('syncing');
      return;
    }

    const address =
      wallet?.address ?? readPollarWalletHint(getClient()).stellarAddress;
    if (!address) {
      setStatus('syncing');
      return;
    }

    void (async () => {
      const stored = readStoredSession();
      if (stored) {
        try {
          const me = await fetchMeProfile(stored.accessToken);
          setUpeerSession(stored);
          setProfile(me);
          setStatus('ready');
          setError(null);
          return;
        } catch {
          // Stale or invalid cookie/JWT — exchange with Pollar below.
        }
      }
      await syncWithPollar();
    })();
  }, [isAuthenticated, verified, wallet?.address, getClient, syncWithPollar]);

  const signOut = useCallback(async () => {
    await logoutUpeerSession();
    setUpeerSession(null);
    setProfile(null);
    setStatus('anonymous');
    setError(null);
    pollarLogout();
  }, [pollarLogout]);

  const isOnboarded = profile ? onboardingComplete(profile) : false;

  const value = useMemo(
    () => ({
      status,
      upeerSession,
      profile,
      error,
      isOnboarded,
      refreshProfile,
      syncWithPollar,
      signOut,
    }),
    [
      status,
      upeerSession,
      profile,
      error,
      isOnboarded,
      refreshProfile,
      syncWithPollar,
      signOut,
    ],
  );

  return (
    <UpeerSessionContext.Provider value={value}>
      {children}
    </UpeerSessionContext.Provider>
  );
}
