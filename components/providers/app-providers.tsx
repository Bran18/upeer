'use client';

import { PollarProvider } from '@pollar/react';
import type { ReactNode } from 'react';
import { OnboardingGate } from '@/components/session/onboarding-gate';
import { ThemeProvider } from '@/components/theme/theme-provider';
import { UpeerSessionProvider } from '@/components/session/upeer-session-provider';
import { ToasterProvider } from '@/components/ui/toaster';
import { getStellarNetworkClient } from '@/lib/config/network-client';

const publishableKey = process.env.NEXT_PUBLIC_POLLAR_PUBLISHABLE_KEY ?? '';

export function AppProviders({ children }: { children: ReactNode }) {
  const stellarNetwork = getStellarNetworkClient();
  const banner = !publishableKey ? (
    <div className="border-b border-amber-500/40 bg-amber-500/10 px-4 py-2 text-center text-sm text-amber-900 dark:text-amber-100">
      Set{' '}
      <code className="font-mono text-xs">
        NEXT_PUBLIC_POLLAR_PUBLISHABLE_KEY
      </code>{' '}
      in <code className="font-mono text-xs">.env.local</code> to enable Pollar
      login.
    </div>
  ) : null;

  if (!publishableKey) {
    return (
      <ThemeProvider>
        <ToasterProvider>
          {banner}
          {children}
        </ToasterProvider>
      </ThemeProvider>
    );
  }

  return (
    <ThemeProvider>
      <PollarProvider
        client={{
          apiKey: publishableKey,
          stellarNetwork,
        }}
      >
        <UpeerSessionProvider>
          <ToasterProvider>
            <OnboardingGate />
            {banner}
            {children}
          </ToasterProvider>
        </UpeerSessionProvider>
      </PollarProvider>
    </ThemeProvider>
  );
}
