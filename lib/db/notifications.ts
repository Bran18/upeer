import { getSupabaseAdmin } from '@/lib/supabase/server';

export type NotificationRow = {
  id: string;
  profile_id: string;
  type: string;
  title: string;
  body: string;
  href: string | null;
  read_at: string | null;
  metadata: Record<string, unknown>;
  created_at: string;
};

export async function createNotification(input: {
  profileId: string;
  type: string;
  title: string;
  body: string;
  href?: string;
  metadata?: Record<string, unknown>;
}): Promise<NotificationRow> {
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from('notifications')
    .insert({
      profile_id: input.profileId,
      type: input.type,
      title: input.title,
      body: input.body,
      href: input.href ?? null,
      metadata: input.metadata ?? {},
    })
    .select('*')
    .single();

  if (error || !data) {
    throw new Error(error?.message ?? 'Failed to create notification');
  }
  return data as NotificationRow;
}

export async function listNotificationsForProfile(
  profileId: string,
  limit = 30,
): Promise<NotificationRow[]> {
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from('notifications')
    .select('*')
    .eq('profile_id', profileId)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) {
    throw new Error(error.message);
  }
  return (data ?? []) as NotificationRow[];
}

export async function countUnreadNotifications(
  profileId: string,
): Promise<number> {
  const supabase = getSupabaseAdmin();
  const { count, error } = await supabase
    .from('notifications')
    .select('*', { count: 'exact', head: true })
    .eq('profile_id', profileId)
    .is('read_at', null);

  if (error) {
    throw new Error(error.message);
  }
  return count ?? 0;
}

export async function markNotificationRead(
  profileId: string,
  notificationId: string,
): Promise<void> {
  const supabase = getSupabaseAdmin();
  const { error } = await supabase
    .from('notifications')
    .update({ read_at: new Date().toISOString() })
    .eq('id', notificationId)
    .eq('profile_id', profileId);

  if (error) {
    throw new Error(error.message);
  }
}

export async function markAllNotificationsRead(profileId: string): Promise<void> {
  const supabase = getSupabaseAdmin();
  const { error } = await supabase
    .from('notifications')
    .update({ read_at: new Date().toISOString() })
    .eq('profile_id', profileId)
    .is('read_at', null);

  if (error) {
    throw new Error(error.message);
  }
}
