'use client';

export type UpeerSessionResponse = {
  accessToken: string;
  expiresAt: string;
  stellarAddress: string;
  profileId?: string;
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

export async function logoutUpeerSession(): Promise<void> {
  await fetch('/api/auth/logout', { method: 'POST', credentials: 'include' });
  clearStoredSession();
}
