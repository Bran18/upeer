import type { MeProfile, PlatformIntent } from '@/lib/profile/types';

export type SetupItem = {
  id: string;
  title: string;
  description: string;
  status: 'done' | 'action' | 'upcoming';
  href?: string;
  hrefLabel?: string;
};

export function buildSetupItems(profile: MeProfile): SetupItem[] {
  const intent = profile.platformIntent;
  if (!intent) {
    return [];
  }

  const items: SetupItem[] = [
    {
      id: 'didid',
      title: 'Identity verification (DIDID)',
      description:
        'Identity checks for higher limits. Available soon.',
      status: 'upcoming',
    },
  ];

  const showBuyer = intent === 'buyer' || intent === 'both';
  const showMerchant = intent === 'merchant' || intent === 'both';

  if (showBuyer) {
    items.push({
      id: 'market',
      title: 'Browse the market',
      description: 'Take a live desk at the posted price per USDC.',
      status: 'action',
      href: '/market',
      hrefLabel: 'Open market',
    });
  }

  if (showMerchant) {
    items.push({
      id: 'post-order',
      title: 'Post an offer',
      description: 'Set your price per USDC and wait for takers.',
      status: profile.payoutAddress ? 'done' : 'action',
      href: profile.payoutAddress ? '/orders/new' : '/settings?tab=payout',
      hrefLabel: profile.payoutAddress ? 'Post offer' : 'Set payout',
    });
    items.push({
      id: 'fiat-payments',
      title: 'Fiat payment methods',
      description:
        profile.paymentPrefs.methods.length > 0
          ? 'Buyers can pay you using your saved instructions.'
          : 'Add bank, PIX, or other rails so buyers know how to pay you.',
      status: profile.paymentPrefs.methods.length > 0 ? 'done' : 'action',
      href: '/settings?tab=fiat',
      hrefLabel: 'Add methods',
    });
  }

  items.push({
    id: 'profile',
      title: 'Name',
      description: profile.displayName
        ? 'Your public name is set.'
        : 'Add a name counterparties can recognize.',
    status: profile.displayName ? 'done' : 'action',
    href: '/settings?tab=profile',
      hrefLabel: 'Edit',
  });

  return items;
}

export function setupProgress(items: SetupItem[]) {
  const actionable = items.filter((item) => item.status !== 'upcoming');
  const completed = actionable.filter((item) => item.status === 'done').length;
  const total = actionable.length;
  const percent = total === 0 ? 0 : Math.round((completed / total) * 100);
  return { completed, total, percent };
}

export function primaryCtaForIntent(intent: PlatformIntent): {
  href: string;
  label: string;
  description: string;
} {
  switch (intent) {
    case 'buyer':
      return {
        href: '/market',
        label: 'Open Market',
        description: 'Compare live desks and take a posted price.',
      };
    case 'merchant':
      return {
        href: '/orders/new',
        label: 'Post an offer',
        description: 'List USDC at your price.',
      };
    case 'both':
      return {
        href: '/market',
        label: 'Open Market',
        description: 'Take a desk or post your own liquidity.',
      };
    default:
      return {
        href: '/market',
        label: 'Open Market',
        description: 'Browse open offers.',
      };
  }
}
