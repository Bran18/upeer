import { roleLabel } from '@/lib/nav/user-links';
import { shortenWallet } from '@/lib/nav/user-identity';
import type { MeProfile } from '@/lib/profile/types';
import { onboardingComplete } from '@/lib/profile/types';

export type AccountCorridor = {
  href: string;
  title: string;
  detail: string;
  tone: 'ready' | 'open';
};

export function sellsOnUpeer(profile: MeProfile | null | undefined): boolean {
  return (
    profile?.platformIntent === 'merchant' || profile?.platformIntent === 'both'
  );
}

export function accountPassCopy(profile: MeProfile | null | undefined): {
  name: string;
  role: string;
  address: string | null;
  addressShort: string | null;
  readiness: string;
} {
  const name = profile?.displayName?.trim() || 'Add your name';
  const role =
    roleLabel(profile?.platformIntent) ??
    (profile ? 'Choose whether you buy, sell, or both' : 'Sign in to load your pass');
  const address = profile?.stellarAddress?.trim() || null;
  const methods = profile?.paymentPrefs.methods.length ?? 0;
  const sells = sellsOnUpeer(profile);

  let readiness = 'Your pass is ready for the market.';
  if (!profile) {
    readiness = 'Account details will appear after session sync.';
  } else if (!onboardingComplete(profile)) {
    readiness = 'Finish setup before you can trade.';
  } else if (!profile.displayName?.trim()) {
    readiness = 'Add a name counterparties can recognize.';
  } else if (methods === 0) {
    readiness = 'Add how you settle local currency.';
  } else if (sells && !profile.payoutAddress) {
    readiness = 'Set where USDC lands when you sell.';
  } else if (sells && profile.merchantStatus === 'rejected') {
    readiness = 'List your desk again to sell on the book.';
  } else if (sells && profile.merchantStatus === 'suspended') {
    readiness = 'This desk is suspended.';
  }

  return {
    name,
    role,
    address,
    addressShort: address ? shortenWallet(address) : null,
    readiness,
  };
}

export function accountCorridors(
  profile: MeProfile | null | undefined,
): AccountCorridor[] {
  const nameSet = Boolean(profile?.displayName?.trim());
  const methods = profile?.paymentPrefs.methods.length ?? 0;
  const payout = Boolean(profile?.payoutAddress);
  const sells = sellsOnUpeer(profile);

  const items: AccountCorridor[] = [
    {
      href: '/settings?tab=profile',
      title: 'Identity',
      tone: nameSet ? 'ready' : 'open',
      detail: nameSet
        ? 'Name and photo shown on trades'
        : 'Add the name counterparties see',
    },
    {
      href: '/settings?tab=fiat',
      title: 'Payment methods',
      tone: methods > 0 ? 'ready' : 'open',
      detail:
        methods === 0
          ? 'Add how you settle local currency'
          : methods === 1
            ? '1 method saved'
            : `${methods} methods saved`,
    },
    {
      href: '/wallet',
      title: 'Wallet',
      tone: 'ready',
      detail: 'Balances, send, receive, and swap',
    },
    {
      href: '/settings?tab=payout',
      title: 'Payout',
      tone: payout ? 'ready' : sells ? 'open' : 'ready',
      detail: payout
        ? 'Sales land at your address'
        : sells
          ? 'Set where USDC lands when you sell'
          : 'Needed when you start selling',
    },
  ];

  if (profile?.isOperator) {
    items.push({
      href: '/admin',
      title: 'Admin',
      tone: 'ready',
      detail: 'Operator tools',
    });
  }

  return items;
}
