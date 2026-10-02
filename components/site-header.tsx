'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import { PollarWalletControl } from '@/components/pollar-wallet-control';
import { ProfileBadge } from '@/components/session/profile-badge';
import { NavLink } from '@/components/transition/nav-link';

const nav = [
  { href: '/market', label: 'Market' },
  { href: '/merchant', label: 'Merchants' },
  { href: '/app', label: 'Console' },
];

function NavItems({
  pathname,
  onNavigate,
  className,
}: {
  pathname: string;
  onNavigate?: () => void;
  className?: string;
}) {
  return (
    <>
      {nav.map((item) => {
        const active =
          pathname === item.href || pathname.startsWith(`${item.href}/`);
        return (
          <NavLink
            key={item.href}
            href={item.href}
            direction="none"
            onClick={onNavigate}
            aria-current={active ? 'page' : undefined}
            className={`block min-h-[44px] rounded-lg px-3 py-2.5 text-[0.9375rem] transition-[color,background-color] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent)] md:inline-flex md:min-h-0 md:rounded-none md:bg-transparent md:px-0 md:py-1 md:text-[0.8125rem] ${
              active
                ? 'bg-[var(--fill)] font-medium text-[var(--foreground)] md:bg-transparent'
                : 'text-[var(--foreground-secondary)] hover:bg-[var(--fill)] hover:text-[var(--foreground)] md:text-[var(--foreground-tertiary)] md:hover:bg-transparent'
            } ${className ?? ''}`}
          >
            {item.label}
          </NavLink>
        );
      })}
    </>
  );
}

export function SiteHeader() {
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    setMenuOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!menuOpen) {
      return;
    }
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setMenuOpen(false);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [menuOpen]);

  return (
    <header
      className="material-bar sticky top-0 z-50"
      style={{ viewTransitionName: 'persistent-nav' }}
    >
      <div className="page-shell flex min-h-12 items-center justify-between gap-3 py-3 pt-[max(0.75rem,env(safe-area-inset-top))]">
        <div className="flex min-w-0 items-center gap-3">
          <Link
            href="/"
            className="shrink-0 font-mono text-[0.8125rem] font-medium tracking-[0.18em] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent)]"
          >
            UPEER
          </Link>
          <nav
            aria-label="Primary"
            className="hidden items-center gap-6 md:flex lg:gap-7"
          >
            <NavItems pathname={pathname} />
          </nav>
        </div>
        <div className="flex shrink-0 items-center gap-2 sm:gap-3">
          <ProfileBadge />
          <PollarWalletControl />
          <button
            type="button"
            className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-lg text-[var(--foreground)] hover:bg-[var(--fill)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent)] md:hidden"
            aria-expanded={menuOpen}
            aria-controls="mobile-primary-nav"
            onClick={() => setMenuOpen((open) => !open)}
          >
            <span className="sr-only">{menuOpen ? 'Close menu' : 'Open menu'}</span>
            <svg
              width="22"
              height="22"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              aria-hidden
            >
              {menuOpen ? (
                <path d="M6 6l12 12M18 6L6 18" />
              ) : (
                <path d="M4 7h16M4 12h16M4 17h16" />
              )}
            </svg>
          </button>
        </div>
      </div>
      {menuOpen ? (
        <nav
          id="mobile-primary-nav"
          aria-label="Primary"
          className="page-shell border-t border-[var(--line)] pb-4 pt-2 md:hidden"
        >
          <div className="flex flex-col gap-1">
            <NavItems
              pathname={pathname}
              onNavigate={() => setMenuOpen(false)}
            />
          </div>
        </nav>
      ) : null}
    </header>
  );
}
