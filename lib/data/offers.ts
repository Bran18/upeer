import { getSupabaseAdmin, isSupabaseConfigured } from '@/lib/supabase/server';
import {
  normalizeSettlementAsset,
  type SettlementAsset,
} from '@/lib/settlement/assets';

export type MarketOffer = {
  id: string;
  merchantName: string;
  makerProfileId: string;
  side: 'sell_usdc' | 'buy_usdc';
  settlementAsset: SettlementAsset;
  fiatCurrency: string;
  pricePerUsdc: string;
  minUsdc: string;
  maxUsdc: string;
  availableUsdc: string;
  verified: boolean;
};

function mapOfferRow(row: {
  id: string;
  side: string;
  fiat_currency: string;
  settlement_asset?: string | null;
  price_per_usdc?: string | number | null;
  min_usdc: string | number;
  max_usdc: string | number;
  available_usdc: string | number;
  maker_profile_id: string;
  profiles?:
    | { display_name: string | null }
    | { display_name: string | null }[];
}): MarketOffer {
  const rawProfile = row.profiles;
  const profile = (Array.isArray(rawProfile)
    ? rawProfile[0]
    : rawProfile) as { display_name: string | null } | undefined;

  const price =
    row.price_per_usdc != null && row.price_per_usdc !== ''
      ? String(row.price_per_usdc)
      : '1';

  const name =
    profile?.display_name?.trim() ||
    `Trader ${row.maker_profile_id.slice(0, 8)}`;

  let settlementAsset: SettlementAsset = 'USDC';
  if (row.settlement_asset) {
    try {
      settlementAsset = normalizeSettlementAsset(String(row.settlement_asset));
    } catch {
      settlementAsset = 'USDC';
    }
  }

  return {
    id: row.id,
    merchantName: name,
    makerProfileId: row.maker_profile_id,
    side: row.side as 'sell_usdc' | 'buy_usdc',
    settlementAsset,
    fiatCurrency: row.fiat_currency,
    pricePerUsdc: price,
    minUsdc: String(row.min_usdc),
    maxUsdc: String(row.max_usdc),
    availableUsdc: String(row.available_usdc),
    verified: false,
  };
}

async function approvedDeskIds(profileIds: string[]): Promise<Set<string>> {
  const verifiedIds = new Set<string>();
  if (profileIds.length === 0 || !isSupabaseConfigured()) {
    return verifiedIds;
  }
  const supabase = getSupabaseAdmin();
  const { data: desks } = await supabase
    .from('merchants')
    .select('profile_id, status')
    .in('profile_id', profileIds)
    .in('status', ['approved', 'pending']);
  for (const desk of desks ?? []) {
    if (desk.profile_id) {
      verifiedIds.add(desk.profile_id as string);
    }
  }
  return verifiedIds;
}

export async function listMarketOffers(): Promise<MarketOffer[]> {
  if (!isSupabaseConfigured()) {
    return [];
  }

  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from('offers')
    .select(
      `
      id,
      side,
      fiat_currency,
      settlement_asset,
      price_per_usdc,
      min_usdc,
      max_usdc,
      available_usdc,
      maker_profile_id,
      profiles:maker_profile_id ( display_name )
    `,
    )
    .eq('status', 'open')
    .not('maker_profile_id', 'is', null);

  if (error) {
    console.error('[listMarketOffers]', error.message);
    return [];
  }
  if (!data?.length) {
    return [];
  }

  const makerIds = [
    ...new Set(
      data
        .map((row) => (row as { maker_profile_id?: string }).maker_profile_id)
        .filter((id): id is string => Boolean(id)),
    ),
  ];
  const verifiedIds = await approvedDeskIds(makerIds);

  return data.map((row) => {
    const mapped = mapOfferRow(row as Parameters<typeof mapOfferRow>[0]);
    return {
      ...mapped,
      verified: verifiedIds.has(mapped.makerProfileId),
    };
  });
}

export async function getOfferById(id: string): Promise<MarketOffer | null> {
  if (!isSupabaseConfigured()) {
    return null;
  }

  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from('offers')
    .select(
      `
      id,
      side,
      fiat_currency,
      settlement_asset,
      price_per_usdc,
      min_usdc,
      max_usdc,
      available_usdc,
      status,
      maker_profile_id,
      profiles:maker_profile_id ( display_name )
    `,
    )
    .eq('id', id)
    .eq('status', 'open')
    .maybeSingle();

  if (error || !data || !data.maker_profile_id) {
    return null;
  }

  const mapped = mapOfferRow(data as Parameters<typeof mapOfferRow>[0]);
  const verifiedIds = await approvedDeskIds([mapped.makerProfileId]);
  return {
    ...mapped,
    verified: verifiedIds.has(mapped.makerProfileId),
  };
}
