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
      id: 'market',
      title: 'Browse the OTC market',
      description: 'Compare verified merchants and lock an executable USDC quote.',
      status: 'action',
      href: '/market',
      hrefLabel: 'Open market',
    });
  }

  if (showMerchant) {
    const approved = profile.merchantStatus === 'approved';
    items.push({
      id: 'merchant',
      title: 'Merchant desk verification',
      description: approved
        ? 'Your desk is approved on testnet.'
        : 'Submit your merchant profile for desk review on testnet.',
      status: approved ? 'done' : 'action',
      href: '/merchant',
      hrefLabel: approved ? 'View desk' : 'Complete merchant profile',
    });
  }

  items.push({
    id: 'profile',
    title: 'Profile details',
    description: profile.displayName
      ? 'Display name is set. Update anytime in settings.'
      : 'Add a display name if you sell or want a public label.',
    status: profile.displayName ? 'done' : 'action',
    href: '#settings',
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
        href: '/merchant',
        label: 'Open merchant desk',
        description: 'Manage offers and settlement.',
      };
    case 'both':
      return {
        href: '/market',
        label: 'Browse market',
        description: 'Buy-side quotes and merchant tools are both available.',
      };
    default:
      return {
        href: '/market',
        label: 'Browse market',
        description: 'Start with live OTC offers.',
      };
  }
}
