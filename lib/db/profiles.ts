import type { PollarVerifiedSession } from '@/lib/pollar/server';
import type {
  MeProfile,
  MerchantStatus,
  PlatformIntent,
} from '@/lib/profile/types';
import { getSupabaseAdmin } from '@/lib/supabase/server';

type ProfileRow = {
  id: string;
  stellar_address: string;
  display_name: string | null;
  platform_intent: PlatformIntent | null;
  onboarding_completed_at: string | null;
};

export async function upsertProfileFromPollar(
  session: PollarVerifiedSession,
): Promise<string> {
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from('profiles')
    .upsert(
      {
        pollar_user_id: session.userId,
        pollar_application_id: session.applicationId,
        stellar_address: session.wallet.publicKey,
        custody: session.wallet.custody,
        network: session.network,
        display_name: session.profile?.displayName ?? null,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'pollar_user_id' },
    )
    .select('id')
    .single();

  if (error || !data) {
    throw new Error(error?.message ?? 'Failed to upsert profile');
  }
  return data.id as string;
}

export async function getMeProfile(profileId: string): Promise<MeProfile | null> {
  const supabase = getSupabaseAdmin();

  const profileResult = await supabase
    .from('profiles')
    .select(
      'id, stellar_address, display_name, platform_intent, onboarding_completed_at',
    )
    .eq('id', profileId)
    .maybeSingle();

  if (profileResult.error) {
    throw new Error(profileResult.error.message);
  }
  if (!profileResult.data) {
    return null;
  }

  const row = profileResult.data as ProfileRow;

  const merchantResult = await supabase
    .from('merchants')
    .select('id, status')
    .eq('profile_id', profileId)
    .maybeSingle();

  if (merchantResult.error) {
    throw new Error(merchantResult.error.message);
  }

  const merchantStatus: MerchantStatus =
    (merchantResult.data?.status as MerchantStatus | undefined) ?? 'none';

  return {
    id: row.id,
    stellarAddress: row.stellar_address,
    displayName: row.display_name,
    platformIntent: row.platform_intent,
    onboardingCompletedAt: row.onboarding_completed_at,
    merchantStatus,
    merchantId: (merchantResult.data?.id as string | undefined) ?? null,
  };
}

export async function completeProfileOnboarding(
  profileId: string,
  input: {
    platformIntent: PlatformIntent;
    displayName?: string;
  },
): Promise<MeProfile> {
  const supabase = getSupabaseAdmin();
  const now = new Date().toISOString();

  const { error: profileError } = await supabase
    .from('profiles')
    .update({
      platform_intent: input.platformIntent,
      onboarding_completed_at: now,
      ...(input.displayName
        ? { display_name: input.displayName, updated_at: now }
        : { updated_at: now }),
    })
    .eq('id', profileId);

  if (profileError) {
    throw new Error(profileError.message);
  }

  const needsMerchant =
    input.platformIntent === 'merchant' || input.platformIntent === 'both';

  if (needsMerchant) {
    const merchantName =
      input.displayName?.trim() ||
      `Merchant ${profileId.slice(0, 8)}`;

    const { error: merchantError } = await supabase.from('merchants').upsert(
      {
        profile_id: profileId,
        display_name: merchantName,
        status: 'pending',
        updated_at: now,
      },
      { onConflict: 'profile_id' },
    );

    if (merchantError) {
      throw new Error(merchantError.message);
    }
  }

  const profile = await getMeProfile(profileId);
  if (!profile) {
    throw new Error('Profile not found after onboarding');
  }
  return profile;
}
