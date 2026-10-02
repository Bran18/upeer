export type PlatformIntent = 'buyer' | 'merchant' | 'both';

export type MerchantStatus =
  | 'none'
  | 'pending'
  | 'approved'
  | 'rejected'
  | 'suspended';

export type MeProfile = {
  id: string;
  stellarAddress: string;
  displayName: string | null;
  platformIntent: PlatformIntent | null;
  onboardingCompletedAt: string | null;
  merchantStatus: MerchantStatus;
  merchantId: string | null;
};

export function onboardingComplete(profile: MeProfile): boolean {
  return profile.onboardingCompletedAt != null && profile.platformIntent != null;
}

export function defaultPathForIntent(intent: PlatformIntent): string {
  switch (intent) {
    case 'buyer':
      return '/market';
    case 'merchant':
      return '/merchant';
    case 'both':
      return '/app';
    default:
      return '/market';
  }
}
