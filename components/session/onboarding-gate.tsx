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
  const { status, isOnboarded, error, profile } = useUpeerSession();

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

  if (error && isAuthenticated && pathname !== '/onboarding') {
    return (
      <div
        className="border-b border-red-500/30 bg-red-500/10 px-4 py-2 text-center text-sm text-red-900 dark:text-red-100"
        role="status"
        aria-live="polite"
      >
        {error} — try signing out and back in, or finish setup on{' '}
        <a href="/onboarding" className="font-medium underline">
          onboarding
        </a>
        .
      </div>
    );
  }

  return null;
}
