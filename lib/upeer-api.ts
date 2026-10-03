'use client';

import type { PollarClient } from '@pollar/core';
import { readPollarWalletHint } from '@/lib/pollar/access-token';
import type { PaymentPrefs } from '@/lib/profile/payment-prefs';
import type { MeProfile, PlatformIntent } from '@/lib/profile/types';

export type UpeerSessionResponse = {
  accessToken: string;
  expiresAt: string;
  stellarAddress: string;
  profileId?: string;
  onboardingComplete?: boolean;
  platformIntent?: PlatformIntent | null;
};

const STORAGE_KEY = 'upeer.session';

export function getUpeerAuthHeaders(
  accessToken?: string | null,
): Record<string, string> {
  const token = accessToken ?? readStoredSession()?.accessToken;
  if (!token) {
    return {};
  }
  return { Authorization: `Bearer ${token}` };
}

/** Same-origin API calls with cookie + Bearer fallback. */
export function upeerAuthedFetch(
  input: RequestInfo | URL,
  init: RequestInit = {},
): Promise<Response> {
  const headers = new Headers(init.headers);
  const auth = getUpeerAuthHeaders();
  if (auth.Authorization) {
    headers.set('Authorization', auth.Authorization);
  }
  return fetch(input, {
    ...init,
    credentials: 'include',
    headers,
  });
}

export function readStoredSession(): UpeerSessionResponse | null {
  if (typeof window === 'undefined') {
    return null;
  }
  const raw = window.localStorage.getItem(STORAGE_KEY);
  if (!raw) {
    return null;
  }
  try {
    const parsed = JSON.parse(raw) as UpeerSessionResponse;
    if (!parsed.accessToken || !parsed.expiresAt) {
      return null;
    }
    if (new Date(parsed.expiresAt).getTime() <= Date.now()) {
      window.localStorage.removeItem(STORAGE_KEY);
      return null;
    }
    return parsed;
  } catch {
    window.localStorage.removeItem(STORAGE_KEY);
    return null;
  }
}

export function writeStoredSession(session: UpeerSessionResponse): void {
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(session));
}

export function clearStoredSession(): void {
  window.localStorage.removeItem(STORAGE_KEY);
}

export type PollarSessionHint = {
  stellarAddress?: string;
  custody?: 'internal' | 'external' | 'smart';
};

export async function exchangePollarSessionFromClient(
  client: PollarClient,
): Promise<UpeerSessionResponse> {
  const auth = client.getAuthState();
  if (auth.step !== 'authenticated') {
    throw new Error('Sign in with Pollar first');
  }
  return exchangePollarSession(
    auth.session.token.accessToken,
    readPollarWalletHint(client),
  );
}

export async function exchangePollarSession(
  pollarAccessToken: string,
  hint?: PollarSessionHint,
): Promise<UpeerSessionResponse> {
  const res = await fetch('/api/auth/pollar', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({
      token: pollarAccessToken,
      ...hint,
    }),
  });
  const data = (await res.json()) as UpeerSessionResponse & {
    error?: string;
  };
  if (!res.ok) {
    throw new Error(data.error ?? 'Session exchange failed');
  }
  writeStoredSession(data);
  return data;
}

export async function fetchMeProfile(accessToken?: string): Promise<MeProfile> {
  const res = await fetch('/api/me', {
    credentials: 'include',
    headers: getUpeerAuthHeaders(accessToken),
  });
  const data = (await res.json()) as { profile?: MeProfile; error?: string };
  if (!res.ok) {
    throw new Error(data.error ?? 'Failed to load profile');
  }
  if (!data.profile) {
    throw new Error('Profile missing in response');
  }
  return data.profile;
}

export type CompleteOnboardingInput = {
  platformIntent: PlatformIntent;
  displayName?: string;
};

export async function completeOnboarding(
  input: CompleteOnboardingInput,
): Promise<{ profile: MeProfile; redirectTo: string }> {
  const res = await fetch('/api/onboarding', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...getUpeerAuthHeaders(),
    },
    credentials: 'include',
    body: JSON.stringify(input),
  });
  const data = (await res.json()) as {
    profile?: MeProfile;
    redirectTo?: string;
    error?: string;
  };
  if (!res.ok) {
    throw new Error(data.error ?? 'Onboarding failed');
  }
  if (!data.profile || !data.redirectTo) {
    throw new Error('Invalid onboarding response');
  }

  const stored = readStoredSession();
  if (stored) {
    writeStoredSession({
      ...stored,
      onboardingComplete: true,
      platformIntent: data.profile.platformIntent,
    });
  }

  return { profile: data.profile, redirectTo: data.redirectTo };
}

export type UpdateMeProfileInput = {
  platformIntent?: PlatformIntent;
  displayName?: string;
  payoutAddress?: string;
  paymentPrefs?: PaymentPrefs;
};

export async function updateMeProfile(
  input: UpdateMeProfileInput,
): Promise<MeProfile> {
  const res = await fetch('/api/me', {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      ...getUpeerAuthHeaders(),
    },
    credentials: 'include',
    body: JSON.stringify(input),
  });
  const data = (await res.json()) as { profile?: MeProfile; error?: string };
  if (!res.ok) {
    throw new Error(data.error ?? 'Failed to update profile');
  }
  if (!data.profile) {
    throw new Error('Profile missing in response');
  }
  return data.profile;
}

export async function logoutUpeerSession(): Promise<void> {
  await fetch('/api/auth/logout', { method: 'POST', credentials: 'include' });
  clearStoredSession();
}
