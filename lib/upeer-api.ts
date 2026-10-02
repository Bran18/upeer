'use client';

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

export async function exchangePollarSession(
  pollarAccessToken: string,
): Promise<UpeerSessionResponse> {
  const res = await fetch('/api/auth/pollar', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({ token: pollarAccessToken }),
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

export async function fetchMeProfile(): Promise<MeProfile> {
  const res = await fetch('/api/me', { credentials: 'include' });
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
    headers: { 'Content-Type': 'application/json' },
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

export async function logoutUpeerSession(): Promise<void> {
  await fetch('/api/auth/logout', { method: 'POST', credentials: 'include' });
  clearStoredSession();
}
