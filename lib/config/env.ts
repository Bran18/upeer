/** Resolves Stellar network from any supported env name. */
export function resolveStellarNetwork(): 'testnet' | 'mainnet' {
  const env =
    process.env.STELLAR_NETWORK ??
    process.env.NEXT_PUBLIC_STELLAR_NETWORK ??
    process.env.NEXT_PUBLIC_NETWORK;
  return env === 'mainnet' ? 'mainnet' : 'testnet';
}

export function resolveSupabaseApiUrl(): string | undefined {
  if (process.env.NEXT_PUBLIC_SUPABASE_URL) {
    return process.env.NEXT_PUBLIC_SUPABASE_URL;
  }
  if (process.env.SUPABASE_URL) {
    return process.env.SUPABASE_URL;
  }
  if (process.env.SUPABASE_DB_URL?.includes(':54322')) {
    return 'http://127.0.0.1:54321';
  }
  return undefined;
}

/** Browser-safe key (publishable / anon). Never use for server writes. */
export function resolveSupabasePublishableKey(): string | undefined {
  return (
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ??
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  );
}

/** Server-only. Required for profile upsert and merchant apply. */
export function resolveSupabaseServiceRoleKey(): string | undefined {
  return (
    process.env.SUPABASE_SERVICE_ROLE_KEY ??
    process.env.SUPABASE_SECRET_KEY
  );
}

export function resolveSessionSecret(): string {
  const fromEnv = process.env.UPEER_SESSION_SECRET?.trim();
  if (fromEnv && fromEnv.length >= 32) {
    return fromEnv;
  }
  if (process.env.NODE_ENV === 'development') {
    return 'upeer-dev-session-secret-do-not-use-in-production-min-32';
  }
  throw new Error(
    'UPEER_SESSION_SECRET must be set (min 32 chars) for server sessions',
  );
}
