import type { PollarVerifiedSession } from '@/lib/pollar/server';
import { getSupabaseAdmin } from '@/lib/supabase/server';

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
