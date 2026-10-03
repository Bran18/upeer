import type { PlatformIntent } from '@/lib/profile/types';

export type RoleOptionConfig = {
  intent: PlatformIntent;
  title: string;
  tag: string;
  description: string;
  bullets: readonly string[];
};

export const ONBOARDING_ROLE_OPTIONS: readonly RoleOptionConfig[] = [
  {
    intent: 'buyer',
    title: 'Buy USDC',
    tag: 'Buyer',
    description: 'Find verified merchants and lock executable OTC quotes.',
    bullets: [
      'Browse offers in your fiat currency',
      'Settle the digital leg via Trustless Work escrow',
      'Track orders from quote to release',
    ],
  },
  {
    intent: 'merchant',
    title: 'Sell USDC',
    tag: 'Merchant',
    description: 'List inventory, set spreads, and serve buyers on UPEER.',
    bullets: [
      'Apply for verification (testnet is manual)',
      'Publish sell-side offers with Reflector references',
      'Receive USDC leg through escrow milestones',
    ],
  },
  {
    intent: 'both',
    title: 'Buy & Sell',
    tag: 'Both',
    description: 'Operate on both sides of the marketplace.',
    bullets: [
      'Buyer market plus merchant desk tools',
      'One wallet and one profile across flows',
      'Manage everything from your dashboard',
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
  return 'Save Profile & Go to Dashboard';
}
