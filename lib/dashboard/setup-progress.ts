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
        'KYC and verifiable credentials for OTC compliance. Available soon.',
      status: 'upcoming',
    },
  ];

  const showBuyer = intent === 'buyer' || intent === 'both';
  const showMerchant = intent === 'merchant' || intent === 'both';

  if (showBuyer) {
    items.push({
      id: 'fund-usdc',
      title: 'Fund USDC for escrow',
      description: 'Swap testnet XLM to USDC before you trade on the market.',
      status: 'action',
      href: '#soroswap',
      hrefLabel: 'Get USDC',
    });
    items.push({
      id: 'market',
      title: 'Browse open orders',
      description: 'Find a price you like and request a P2P trade.',
      status: 'action',
      href: '/market',
      hrefLabel: 'Open market',
    });
  }

  if (showMerchant) {
    items.push({
      id: 'post-order',
      title: 'Post an order',
      description: 'Set your price per USDC and wait for takers.',
      status: profile.payoutAddress ? 'done' : 'action',
      href: profile.payoutAddress ? '/orders/new' : '/settings?tab=payout',
      hrefLabel: profile.payoutAddress ? 'Post order' : 'Set payout',
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
    title: 'Profile details',
    description: profile.displayName
      ? 'Display name is set. Update anytime in settings.'
      : 'Add a display name if you sell or want a public label.',
    status: profile.displayName ? 'done' : 'action',
    href: '/settings?tab=profile',
    hrefLabel: 'Edit settings',
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
        label: 'Browse market',
        description: 'Find a desk and lock a quote.',
      };
    case 'merchant':
      return {
        href: '/orders/new',
        label: 'Post order',
        description: 'List USDC at your price.',
      };
    case 'both':
      return {
        href: '/orders',
        label: 'Your trades',
        description: 'Manage incoming requests and active escrows.',
      };
    default:
      return {
        href: '/market',
        label: 'Browse market',
        description: 'Start with live OTC offers.',
      };
  }
}
