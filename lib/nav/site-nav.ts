import type { MeProfile } from '@/lib/profile/types';

export type NavItem = {
  href: string;
  label: string;
  match?: string[];
  /** Paths that should not count as active for this item (e.g. `/orders/new` under `/orders`). */
  activeExcept?: string[];
};

export const postOrderNavItem: NavItem = {
  href: '/orders/new',
  label: 'Post order',
  match: ['/orders/new'],
};

export function headerNavItems(
  isAuthenticated: boolean,
  isOnboarded: boolean,
): NavItem[] {
  const browse = [
    { href: '/exchange', label: 'Exchange', match: ['/', '/exchange'] },
    { href: '/market', label: 'Market', match: ['/market'] },
    postOrderNavItem,
  ];

  if (!isAuthenticated) {
    return browse;
  }
  if (!isOnboarded) {
    return [
      { href: '/onboarding', label: 'Finish setup' },
      ...browse,
    ];
  }
  return [
    ...browse,
    {
      href: '/orders',
      label: 'Activity',
      match: ['/orders', '/activity'],
      activeExcept: ['/orders/new'],
    },
    { href: '/account', label: 'Account', match: ['/account', '/settings', '/wallet'] },
  ];
}

export function merchantNavItems(profile: MeProfile | null | undefined): NavItem[] {
  if (!profile) {
    return [];
  }
  const merchant =
    profile.platformIntent === 'merchant' || profile.platformIntent === 'both';
  if (!merchant) {
    return [];
  }
  return [
    { href: '/orders', label: 'Orders' },
    { href: '/merchant', label: 'Liquidity' },
    { href: '/dashboard', label: 'Performance' },
  ];
}

export function accountMenuItems(profile: MeProfile | null | undefined): NavItem[] {
  const items: NavItem[] = [
    { href: '/account', label: 'Account' },
    { href: '/wallet', label: 'Wallet' },
    { href: '/settings', label: 'Preferences' },
  ];
  if (profile?.isOperator) {
    items.unshift({ href: '/admin', label: 'Admin' });
  }
  return items;
}

export const footerNavItems: NavItem[] = [
  { href: '/exchange', label: 'Exchange' },
  { href: '/orders', label: 'Activity' },
  { href: '/account', label: 'Account' },
];
