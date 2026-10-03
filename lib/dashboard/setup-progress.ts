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
      id: 'fund-usdc',
      title: 'Fund USDC for escrow',
      description: 'Swap testnet XLM to USDC before you trade on the market.',
      status: 'action',
      href: '#soroswap',
      hrefLabel: 'Get USDC',
    });
    items.push({
      id: 'market',
      title: 'Start an exchange',
      description: 'Get a quote for the amount you want to buy or sell.',
      status: 'action',
      href: '/exchange',
      hrefLabel: 'Start exchange',
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
        href: '/exchange',
        label: 'Start exchange',
        description: 'Say what you have, what you want, and how much.',
      };
    case 'merchant':
      return {
        href: '/orders/new',
        label: 'Post an offer',
        description: 'List USDC at your price.',
      };
    case 'both':
      return {
        href: '/exchange',
        label: 'Start exchange',
        description: 'Buy or sell from the same quote.',
      };
    default:
      return {
        href: '/exchange',
        label: 'Start exchange',
        description: 'Begin with a transparent quote.',
      };
  }
}
