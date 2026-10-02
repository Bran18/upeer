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
      className="sticky top-0 z-50 border-b border-[var(--line)] bg-[#030303]/75 backdrop-blur-xl"
      style={{ viewTransitionName: 'persistent-nav' }}
    >
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-4 sm:px-6">
        <div className="flex items-center gap-8">
          <Link
            href="/"
            className="font-[family-name:var(--font-display)] text-lg font-bold tracking-tight"
          >
            UPEER
          </Link>
          <nav className="hidden items-center gap-1 sm:flex">
            {nav.map((item) => {
              const active =
                pathname === item.href || pathname.startsWith(`${item.href}/`);
              return (
                <NavLink
                  key={item.href}
                  href={item.href}
                  direction="none"
                  className={`rounded-full px-3.5 py-1.5 text-sm transition ${
                    active
                      ? 'bg-white/10 text-[var(--foreground)]'
                      : 'text-[var(--muted)] hover:text-[var(--foreground)]'
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
