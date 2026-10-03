import { shortenWallet } from '@/lib/nav/user-identity';
import {
  assetRefId,
  balanceRowToAssetRef,
} from '@/lib/pollar/swap-assets';

export type StellarBalanceRow = {
  type?: string;
  code: string;
  issuer?: string;
  balance?: string | null;
  available?: string | null;
  chain?: string;
};

export type WalletBalanceOption = {
  id: string;
  label: string;
  shortLabel: string;
  available: string | null;
  balance: string | null;
  asset: ReturnType<typeof balanceRowToAssetRef>;
};

export function balanceId(record: StellarBalanceRow): string {
  return assetRefId(balanceRowToAssetRef(record));
}

export function balanceLabel(record: StellarBalanceRow): string {
  if (record.type === 'native') {
    return 'XLM (native)';
  }
  if (record.issuer) {
    return `${record.code} · ${shortenWallet(record.issuer)}`;
  }
  return record.code;
}

export function balanceShortLabel(record: StellarBalanceRow): string {
  if (record.type === 'native' || record.code === 'XLM') {
    return 'XLM';
  }
  return record.code;
}

export function toBalanceOptions(rows: StellarBalanceRow[]): WalletBalanceOption[] {
  return rows.map((b) => ({
    id: balanceId(b),
    label: balanceLabel(b),
    shortLabel: balanceShortLabel(b),
    available: b.available ?? null,
    balance: b.balance ?? null,
    asset: balanceRowToAssetRef(b),
  }));
}

export function pickPrimaryBalance(rows: StellarBalanceRow[]): WalletBalanceOption | null {
  const options = toBalanceOptions(rows);
  if (options.length === 0) {
    return null;
  }
  const usdc = options.find((o) => o.shortLabel === 'USDC');
  if (usdc) {
    return usdc;
  }
  const xlm = options.find((o) => o.id === 'native');
  if (xlm) {
    return xlm;
  }
  return options[0];
}

export function formatBalanceAmount(value: string | null | undefined): string {
  if (value == null || value === '') {
    return '—';
  }
  const n = Number(value);
  if (!Number.isFinite(n)) {
    return value;
  }
  return new Intl.NumberFormat(undefined, {
    maximumFractionDigits: 7,
    minimumFractionDigits: 0,
  }).format(n);
}
