'use client';

import { usePathname, useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { usePollar } from '@pollar/react';
import { useUpeerSession } from '@/components/session/upeer-session-provider';
import { defaultPathForIntent } from '@/lib/profile/types';

export function OnboardingGate() {
  const pathname = usePathname();
  const router = useRouter();
  const { isAuthenticated, verified } = usePollar();
  const { status, isOnboarded, error, profile, syncWithPollar } =
    useUpeerSession();

  useEffect(() => {
    if (!isAuthenticated || !verified || status !== 'ready') {
      return;
    }

    if (isOnboarded) {
      if (pathname === '/onboarding' && profile?.platformIntent) {
        router.replace(defaultPathForIntent(profile.platformIntent));
      }
      return;
    }

    if (pathname !== '/onboarding') {
      router.replace('/onboarding');
    }
  }, [
    isAuthenticated,
    verified,
    status,
    isOnboarded,
    profile,
    pathname,
    router,
  ]);

  if (status === 'syncing' && isAuthenticated && pathname !== '/onboarding') {
    return (
      <div
        className="material-bar border-b px-4 py-2 text-center text-sm text-[var(--foreground-secondary)]"
        role="status"
        aria-live="polite"
      >
        Connecting your Pollar wallet to UPEER…
      </div>
    );
  }

  if (
    error &&
    status === 'error' &&
    isAuthenticated &&
    pathname !== '/onboarding'
  ) {
    return (
      <div
        className="border-b border-red-500/30 bg-red-500/10 px-4 py-2 text-center text-sm text-red-900 dark:text-red-100"
        role="status"
        aria-live="polite"
      >
        {error}.{' '}
        <button
          type="button"
          className="font-medium underline"
          onClick={() => void syncWithPollar()}
        >
          Retry connection
        </button>{' '}
        or sign out and back in. Finish setup on{' '}
        <a href="/onboarding" className="font-medium underline">
          onboarding
        </a>
        .
      </div>
    );
  }

  return null;
}
