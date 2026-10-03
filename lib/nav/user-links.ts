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

export { merchantNavItems } from '@/lib/nav/site-nav';

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

export {
  menuTriggerLabel,
  resolveUserIdentity,
  shortenWallet,
} from '@/lib/nav/user-identity';
export type { UserIdentity } from '@/lib/nav/user-identity';
