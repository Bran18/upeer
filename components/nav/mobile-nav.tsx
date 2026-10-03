'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { usePollar } from '@pollar/react';
import { useCallback, useEffect, useId, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { IconMenu } from '@/components/ui/icons/chevron';
import { useOptionalUpeerSession } from '@/components/session/upeer-session-provider';
import { useDismissible } from '@/hooks/use-dismissible';
import { cn } from '@/lib/cn';
import { accountMenuLinks, navLinksForSession } from '@/lib/nav/user-links';

type MobileNavProps = {
  overlay?: boolean;
};

export function MobileNav({ overlay = false }: MobileNavProps) {
  const panelId = useId();
  const pathname = usePathname();
  const panelRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const [open, setOpen] = useState(false);

  const { isAuthenticated, openLoginModal } = usePollar();
  const session = useOptionalUpeerSession();

  const close = useCallback(() => setOpen(false), []);
  useDismissible(open, close, [panelRef, triggerRef]);

  useEffect(() => {
    close();
  }, [pathname, close]);

  useEffect(() => {
    if (!open) {
      return;
    }
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = '';
    };
  }, [open]);

  const mainLinks = navLinksForSession(
    isAuthenticated,
    Boolean(session?.isOnboarded),
    session?.profile?.platformIntent,
  );

  const accountLinks = isAuthenticated
    ? accountMenuLinks(
        Boolean(session?.isOnboarded),
        session?.profile?.platformIntent,
      )
    : [];

  const linkClass = (href: string) => {
    const active = pathname === href || pathname.startsWith(`${href}/`);
    return cn('menu-item rounded-[var(--radius-ui)]', active && 'menu-item--active');
  };

  return (
    <div className="lg:hidden">
      <Button
        ref={triggerRef}
        type="button"
        variant={overlay ? 'secondary' : 'ghost'}
        size="sm"
        aria-expanded={open}
        aria-controls={panelId}
        aria-label={open ? 'Close menu' : 'Open menu'}
        className={cn(
          overlay && 'border-white/20 bg-white/10 text-white hover:bg-white/15',
        )}
        onClick={() => setOpen((value) => !value)}
      >
        <IconMenu />
      </Button>

      {open ? (
        <div className="fixed inset-0 z-[90]">
          <button
            type="button"
            className="absolute inset-0 bg-black/55 backdrop-blur-[2px]"
            aria-label="Close menu"
            onClick={close}
          />
          <div
            ref={panelRef}
            id={panelId}
            role="dialog"
            aria-modal="true"
            aria-label="Navigation"
            className="menu-panel absolute right-[max(0.75rem,env(safe-area-inset-right))] top-[calc(var(--site-header-height)+0.5rem)] flex max-h-[min(32rem,calc(100dvh-var(--site-header-height)-1.5rem))] w-[min(20rem,calc(100vw-1.5rem))] flex-col overflow-hidden"
          >
            <div className="border-b border-[var(--line)] px-4 py-3">
              <p className="text-sm font-semibold">Navigate</p>
              <p className="text-xs text-[var(--foreground-secondary)]">
                Buy, sell, and manage your account
              </p>
            </div>
            <nav className="flex-1 overflow-y-auto p-2" aria-label="Mobile">
              {mainLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className={linkClass(link.href)}
                  onClick={close}
                >
                  {link.label}
                </Link>
              ))}
            </nav>
            {isAuthenticated ? (
              <div className="border-t border-[var(--line)] p-2">
                <p className="px-3 py-1 text-[0.6875rem] uppercase tracking-[0.16em] text-[var(--foreground-tertiary)]">
                  Account
                </p>
                {accountLinks
                  .filter(
                    (link) => !mainLinks.some((main) => main.href === link.href),
                  )
                  .map((link) => (
                    <Link
                      key={link.href}
                      href={link.href}
                      className={linkClass(link.href)}
                      onClick={close}
                    >
                      {link.label}
                    </Link>
                  ))}
              </div>
            ) : (
              <div className="border-t border-[var(--line)] p-3">
                <Button
                  type="button"
                  fullWidth
                  onClick={() => {
                    close();
                    openLoginModal();
                  }}
                >
                  Sign in
                </Button>
              </div>
            )}
          </div>
        </div>
      ) : null}
    </div>
  );
}
