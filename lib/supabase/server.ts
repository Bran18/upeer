import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import {
  resolveSupabaseApiUrl,
  resolveSupabaseServiceRoleKey,
} from '@/lib/config/env';

let adminClient: SupabaseClient | null = null;

export function getSupabaseAdmin(): SupabaseClient {
  if (adminClient) {
    return adminClient;
  }
  const url = resolveSupabaseApiUrl();
  const key = resolveSupabaseServiceRoleKey();
  if (!url || !key) {
    throw new Error(
      'Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY (Project Settings → API → service_role). The publishable key cannot replace the service role on the server.',
    );
  }
  adminClient = createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  return adminClient;
}

export function isSupabaseConfigured(): boolean {
  return Boolean(resolveSupabaseApiUrl() && resolveSupabaseServiceRoleKey());
}
