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
import { readPollarAccessToken } from '@/lib/pollar/access-token';
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
  const { getClient, isAuthenticated, verified, logout: pollarLogout } =
    usePollar();
  const [upeerSession, setUpeerSession] = useState<UpeerSessionResponse | null>(
    () => readStoredSession(),
  );
  const [profile, setProfile] = useState<MeProfile | null>(null);
  const [status, setStatus] = useState<UpeerSessionStatus>('anonymous');
  const [error, setError] = useState<string | null>(null);
  const syncInFlight = useRef(false);

  const refreshProfile = useCallback(async () => {
    const me = await fetchMeProfile();
    setProfile(me);
  }, []);

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
      const session = await exchangePollarSession(token);
      setUpeerSession(session);
      const me = await fetchMeProfile();
      setProfile(me);
      setStatus('ready');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Session sync failed');
      setStatus('error');
    } finally {
      syncInFlight.current = false;
    }
  }, [getClient]);

  useEffect(() => {
    if (!isAuthenticated || !verified) {
      setStatus('anonymous');
      setProfile(null);
      if (!isAuthenticated) {
        setUpeerSession(null);
      }
      return;
    }
    void syncWithPollar();
  }, [isAuthenticated, verified, syncWithPollar]);

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
