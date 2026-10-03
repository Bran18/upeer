'use client';

import Link from 'next/link';
import { MobileNav } from '@/components/nav/mobile-nav';
import { PrimaryNav } from '@/components/nav/primary-nav';
import { UserMenu } from '@/components/nav/user-menu';
import { SiteLogo } from '@/components/site-logo';
import { cn } from '@/lib/cn';

export function SiteHeader({ overlay = false }: { overlay?: boolean }) {
  return (
    <header
      className={
        overlay
          ? 'pointer-events-none absolute inset-x-0 top-0 z-[60]'
          : 'material-bar sticky top-0 z-50 border-b border-[var(--line)]'
      }
      style={{ viewTransitionName: 'persistent-nav' }}
    >
      <div
        className={cn(
          'page-shell flex min-h-14 items-center gap-3 py-3 pt-[max(0.75rem,env(safe-area-inset-top))]',
          overlay && 'pointer-events-none',
        )}
      >
        <div className="pointer-events-auto flex min-w-0 shrink-0 items-center gap-2">
          <Link
            href="/"
            translate="no"
            className="shrink-0 rounded-[var(--radius-ui)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[var(--accent)]"
            aria-label="UPEER home"
          >
            <SiteLogo priority className="h-8 w-auto sm:h-9" />
          </Link>
        </div>

        <div className="pointer-events-auto hidden min-w-0 flex-1 justify-center lg:flex">
          <PrimaryNav overlay={overlay} />
        </div>

        <div className="pointer-events-auto ml-auto flex min-w-0 shrink-0 items-center gap-2">
          <MobileNav overlay={overlay} />
          <UserMenu overlay={overlay} />
        </div>
      </div>
    </header>
  );
}
