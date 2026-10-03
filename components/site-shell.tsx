'use client';

import { usePathname } from 'next/navigation';
import { useEffect, type ReactNode } from 'react';
import { SiteFooter } from '@/components/site-footer';
import { SiteHeader } from '@/components/site-header';

export function SiteShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const isLanding = pathname === '/';

  useEffect(() => {
    document.documentElement.classList.toggle('experience-lock', isLanding);
    return () => document.documentElement.classList.remove('experience-lock');
  }, [isLanding]);

  return (
    <>
      <SiteHeader overlay={isLanding} />
      <main
        id="main-content"
        className={
          isLanding
            ? 'relative z-[2] min-h-[100dvh] scroll-mt-0'
            : 'relative z-[2] flex-1 scroll-mt-[var(--site-header-height)]'
        }
        tabIndex={-1}
      >
        {children}
      </main>
      <SiteFooter landing={isLanding} />
    </>
  );
}
