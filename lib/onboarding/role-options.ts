import type { PlatformIntent } from '@/lib/profile/types';

export type RoleOptionConfig = {
  intent: PlatformIntent;
  title: string;
  tag: string;
  glyph: string;
  description: string;
  bullets: readonly string[];
};

export const ONBOARDING_ROLE_OPTIONS: readonly RoleOptionConfig[] = [
  {
    intent: 'buyer',
    title: 'Buy USDC',
    tag: 'Buy',
    glyph: '↓',
    description: 'Pay in local currency and receive USDC.',
    bullets: [
      'Browse live desks and take a posted price',
      'Pay with a method you already use',
      'Follow the exchange through to completion',
    ],
  },
  {
    intent: 'merchant',
    title: 'Sell USDC',
    tag: 'Sell',
    glyph: '↑',
    description: 'Quote a price and receive local currency.',
    bullets: [
      'Post offers at your price',
      'Takers find you on the market',
      'Keep payouts on an address you control',
    ],
  },
  {
    intent: 'both',
    title: 'Buy & sell',
    tag: 'Both',
    glyph: '⇄',
    description: 'Trade in both directions from one account.',
    bullets: [
      'One account for both directions',
      'Merchant tools stay in Account',
      'Same market and orders in both directions',
    ],
  },
] as const;

export function onboardingSubmitLabel(busy: boolean, hasIntent: boolean): string {
  if (busy) {
    return 'Saving…';
  }
  if (!hasIntent) {
    return 'Choose a role to save';
  }
  return 'Finish setup';
}

export function roleOptionForIntent(
  intent: PlatformIntent,
): RoleOptionConfig | undefined {
  return ONBOARDING_ROLE_OPTIONS.find((option) => option.intent === intent);
}
