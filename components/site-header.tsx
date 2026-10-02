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
      <div className="mx-auto flex h-[52px] max-w-[1068px] items-center justify-between gap-4 px-6">
        <div className="flex items-center gap-10">
          <Link
            href="/"
            className="text-[1.0625rem] font-semibold tracking-tight"
          >
            UPEER
          </Link>
          <nav className="hidden items-center gap-8 sm:flex">
            {nav.map((item) => {
              const active =
                pathname === item.href || pathname.startsWith(`${item.href}/`);
              return (
                <NavLink
                  key={item.href}
                  href={item.href}
                  direction="none"
                  className={`text-[0.8125rem] transition ${
                    active
                      ? 'font-semibold text-[var(--foreground)]'
                      : 'text-[var(--foreground-secondary)] hover:text-[var(--foreground)]'
                  }`}
                >
                  {item.label}
                </NavLink>
              );
            })}
          </nav>
        </div>
        <div className="flex items-center gap-3">
          <ProfileBadge />
          <PollarWalletControl />
        </div>
      </div>
    </header>
  );
}
