'use client';

import { usePathname } from 'next/navigation';
import { useEffect, type ReactNode } from 'react';
import { SiteFooter } from '@/components/site-footer';
import { SiteHeader } from '@/components/site-header';

export function SiteShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const isHome = pathname === '/';

  useEffect(() => {
    document.documentElement.classList.remove('experience-lock');
  }, [pathname]);

  return (
    <>
      <SiteHeader />
      <main
        id="main-content"
        className="relative z-[2] flex-1 scroll-mt-[var(--site-header-height)]"
        tabIndex={-1}
      >
        {children}
      </main>
      <SiteFooter landing={isHome} />
    </>
  );
}
