import type { MeProfile } from '@/lib/profile/types';

export type NavItem = { href: string; label: string; match?: string[] };

export function headerNavItems(
  isAuthenticated: boolean,
  isOnboarded: boolean,
): NavItem[] {
  if (!isAuthenticated) {
    return [{ href: '/exchange', label: 'Exchange', match: ['/', '/exchange'] }];
  }
  if (!isOnboarded) {
    return [
      { href: '/onboarding', label: 'Finish setup' },
      { href: '/exchange', label: 'Exchange', match: ['/', '/exchange'] },
    ];
  }
  return [
    { href: '/exchange', label: 'Exchange', match: ['/', '/exchange'] },
    { href: '/orders', label: 'Activity', match: ['/orders', '/activity'] },
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
    { href: '/orders/new', label: 'Offers' },
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
