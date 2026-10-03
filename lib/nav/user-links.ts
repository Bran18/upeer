import type { PlatformIntent } from '@/lib/profile/types';
import {
  accountMenuItems,
  footerNavItems,
  headerNavItems,
  type NavItem,
} from '@/lib/nav/site-nav';
import type { MeProfile } from '@/lib/profile/types';

export type NavLinkItem = NavItem;

export function navLinksForSession(
  isAuthenticated: boolean,
  isOnboarded: boolean,
  _platformIntent?: PlatformIntent | null,
): NavLinkItem[] {
  return headerNavItems(isAuthenticated, isOnboarded);
}

export function accountMenuLinks(profile: MeProfile | null | undefined): NavLinkItem[] {
  return accountMenuItems(profile);
}

export function footerLinks(): NavLinkItem[] {
  return footerNavItems;
}

export function roleLabel(intent: PlatformIntent | null | undefined): string | null {
  if (!intent) {
    return null;
  }
  switch (intent) {
    case 'buyer':
      return 'Buyer';
    case 'merchant':
      return 'Seller';
    case 'both':
      return 'Buyer & seller';
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
