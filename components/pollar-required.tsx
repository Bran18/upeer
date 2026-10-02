'use client';

import type { ReactNode } from 'react';

export function hasPollarPublishableKey(): boolean {
  return Boolean(process.env.NEXT_PUBLIC_POLLAR_PUBLISHABLE_KEY);
}

export function PollarRequired({
  children,
  fallback,
}: {
  children: ReactNode;
  fallback?: ReactNode;
}) {
  if (!hasPollarPublishableKey()) {
    return (
      fallback ?? (
        <p className="text-sm text-zinc-600 dark:text-zinc-400">
          Set <code className="font-mono text-xs">NEXT_PUBLIC_POLLAR_PUBLISHABLE_KEY</code>{' '}
          to use wallet features.
        </p>
      )
    );
  }
  return children;
}
