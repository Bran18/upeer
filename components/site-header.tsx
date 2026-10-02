'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { PollarWalletControl } from '@/components/pollar-wallet-control';
import { ProfileBadge } from '@/components/session/profile-badge';
import { NavLink } from '@/components/transition/nav-link';

const nav = [
  { href: '/market', label: 'Market' },
  { href: '/merchant', label: 'Merchants' },
  { href: '/app', label: 'Console' },
];

export function SiteHeader() {
  const pathname = usePathname();

  return (
    <header
      className="material-bar sticky top-0 z-50"
      style={{ viewTransitionName: 'persistent-nav' }}
    >
      <div className="mx-auto flex min-h-12 max-w-[1120px] items-center justify-between gap-4 px-5 py-3 pt-[max(0.75rem,env(safe-area-inset-top))] sm:px-8">
        <div className="flex min-w-0 items-center gap-8">
          <Link
            href="/"
            className="font-mono text-[0.8125rem] font-medium tracking-[0.18em] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent)]"
          >
            UPEER
          </Link>
          <nav
            aria-label="Primary"
            className="flex items-center gap-5 overflow-x-auto sm:gap-7"
          >
            {nav.map((item) => {
              const active =
                pathname === item.href || pathname.startsWith(`${item.href}/`);
              return (
                <NavLink
                  key={item.href}
                  href={item.href}
                  direction="none"
                  aria-current={active ? 'page' : undefined}
                  className={`whitespace-nowrap text-[0.8125rem] transition-[color] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent)] ${
                    active
                      ? 'text-[var(--foreground)]'
                      : 'text-[var(--foreground-tertiary)] hover:text-[var(--foreground)]'
                  }`}
                >
                  {item.label}
                </NavLink>
              );
            })}
          </nav>
        </div>
        <div className="flex shrink-0 items-center gap-3">
          <ProfileBadge />
          <PollarWalletControl />
        </div>
      </div>
    </header>
  );
}
