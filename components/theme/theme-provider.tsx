'use client';

import { useEffect, type ReactNode } from 'react';
import {
  applyTheme,
  getSystemTheme,
  readStoredTheme,
  resolvedTheme,
} from '@/lib/theme';

export function ThemeProvider({ children }: { children: ReactNode }) {
  useEffect(() => {
    applyTheme(resolvedTheme());

    const media = window.matchMedia('(prefers-color-scheme: light)');
    const onSystem = () => {
      if (!readStoredTheme()) {
        applyTheme(getSystemTheme());
      }
    };
    const onCustom = () => applyTheme(resolvedTheme());

    media.addEventListener('change', onSystem);
    window.addEventListener('upeer-theme', onCustom);
    window.addEventListener('storage', onCustom);
    return () => {
      media.removeEventListener('change', onSystem);
      window.removeEventListener('upeer-theme', onCustom);
      window.removeEventListener('storage', onCustom);
    };
  }, []);

  return children;
}
