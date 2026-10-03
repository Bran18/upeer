import type { MeProfile } from '@/lib/profile/types';

export type NavItem = { href: string; label: string };

export function headerNavItems(
  isAuthenticated: boolean,
  isOnboarded: boolean,
): NavItem[] {
  if (!isAuthenticated) {
    return [{ href: '/market', label: 'Market' }];
  }
  if (!isOnboarded) {
    return [
      { href: '/onboarding', label: 'Finish setup' },
      { href: '/market', label: 'Market' },
    ];
  }
  return [
    { href: '/market', label: 'Market' },
    { href: '/orders', label: 'Orders' },
    { href: '/orders/new', label: 'Post order' },
  ];
}

export function accountMenuItems(profile: MeProfile | null | undefined): NavItem[] {
  const items: NavItem[] = [
    { href: '/dashboard', label: 'Dashboard' },
    { href: '/settings', label: 'Settings' },
    { href: '/app', label: 'Developer tools' },
  ];
  if (profile?.isOperator) {
    items.unshift({ href: '/admin', label: 'Admin' });
  }
  return items;
}

export const footerNavItems: NavItem[] = [
  { href: '/', label: 'Home' },
  { href: '/market', label: 'Market' },
];
