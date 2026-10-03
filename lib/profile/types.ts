import type { PaymentPrefs } from '@/lib/profile/payment-prefs';

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
  avatarUrl: string | null;
  platformIntent: PlatformIntent | null;
  onboardingCompletedAt: string | null;
  merchantStatus: MerchantStatus;
  merchantId: string | null;
  payoutAddress: string | null;
  paymentPrefs: PaymentPrefs;
  isOperator: boolean;
};

export function onboardingComplete(profile: MeProfile): boolean {
  return profile.onboardingCompletedAt != null && profile.platformIntent != null;
}

/** Where users land after onboarding or when revisiting setup. */
export const USER_HOME_PATH = '/dashboard';

export function defaultPathForIntent(_intent: PlatformIntent): string {
  return USER_HOME_PATH;
}
