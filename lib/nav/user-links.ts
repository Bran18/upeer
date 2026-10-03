import type { MeProfile, PlatformIntent } from '@/lib/profile/types';

export type NavLinkItem = {
  href: string;
  label: string;
};

export function navLinksForSession(
  isAuthenticated: boolean,
  isOnboarded: boolean,
  platformIntent: PlatformIntent | null | undefined,
): NavLinkItem[] {
  if (!isAuthenticated) {
    return [{ href: '/market', label: 'Market' }];
  }

  if (!isOnboarded) {
    return [
      { href: '/onboarding', label: 'Finish setup' },
      { href: '/market', label: 'Market' },
    ];
  }

  const links: NavLinkItem[] = [{ href: '/dashboard', label: 'Dashboard' }];

  if (platformIntent === 'buyer' || platformIntent === 'both') {
    links.push({ href: '/market', label: 'Market' });
  }
  if (platformIntent === 'merchant' || platformIntent === 'both') {
    links.push({ href: '/merchant', label: 'Merchants' });
  }

  return links;
}

export function accountMenuLinks(
  isOnboarded: boolean,
  platformIntent: PlatformIntent | null | undefined,
): NavLinkItem[] {
  const items: NavLinkItem[] = [{ href: '/dashboard', label: 'Dashboard' }];

  if (!isOnboarded) {
    items.push({ href: '/onboarding', label: 'Finish setup' });
  }

  if (platformIntent === 'buyer' || platformIntent === 'both') {
    items.push({ href: '/market', label: 'Market' });
  }
  if (platformIntent === 'merchant' || platformIntent === 'both') {
    items.push({ href: '/merchant', label: 'Merchants' });
  }

  items.push({ href: '/app', label: 'Developer tools' });

  return items;
}

export function roleLabel(intent: PlatformIntent | null | undefined): string | null {
  if (!intent) {
    return null;
  }
  switch (intent) {
    case 'buyer':
      return 'Buyer';
    case 'merchant':
      return 'Merchant';
    case 'both':
      return 'Buyer & merchant';
    default:
      return null;
  }
}

export function shortenWallet(address: string): string {
  if (address.length < 12) {
    return address;
  }
  return `${address.slice(0, 4)}…${address.slice(-4)}`;
}

export function menuTriggerLabel(
  displayName: string | null | undefined,
  walletAddress: string | null | undefined,
): string {
  if (displayName?.trim()) {
    return displayName.trim();
  }
  if (walletAddress) {
    return shortenWallet(walletAddress);
  }
  return 'Account';
}
