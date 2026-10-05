import { Asset, Networks } from '@stellar/stellar-sdk';
import { getStellarNetwork } from '@/lib/config/network';

export const SETTLEMENT_ASSET_VALUES = ['USDC', 'XLM', 'USDT0'] as const;
export type SettlementAsset = (typeof SETTLEMENT_ASSET_VALUES)[number];

const USDC_ISSUERS = {
  testnet: 'GBBD47IF6LWK7P7MDEVSCWR7DPUWV3NY3DTQEVFL4NAT4AQH3ZLLFLA5',
  mainnet: 'GA5ZSEJYB37JRC5AVCIA5MOP4RHTM335X2KGX3IHOJAPP5RE34K4KZVN',
} as const;

const USDT0_ISSUER_MAINNET =
  'GATISXX6BZ6NC7IKQBY37CJD4SOZL3CYZJWXEDG6JVIY4WBS6KXJHN6Q';

export type SettlementAssetMeta = {
  code: SettlementAsset;
  label: string;
  needsTrustline: boolean;
  /** Trustless Work deploy trustline.address (issuer G or native SAC C…) */
  trustlineAddress: string;
  trustlineSymbol: string;
  networks: readonly ('testnet' | 'mainnet')[];
  hasClawbackRisk: boolean;
};

function nativeSacContractId(network: 'testnet' | 'mainnet'): string {
  const passphrase =
    network === 'mainnet' ? Networks.PUBLIC : Networks.TESTNET;
  return Asset.native().contractId(passphrase);
}

export function settlementAssetsForNetwork(
  network: 'testnet' | 'mainnet',
): SettlementAssetMeta[] {
  const list: SettlementAssetMeta[] = [
    {
      code: 'USDC',
      label: 'USDC',
      needsTrustline: true,
      trustlineAddress: USDC_ISSUERS[network],
      trustlineSymbol: 'USDC',
      networks: ['testnet', 'mainnet'],
      hasClawbackRisk: false,
    },
    {
      code: 'XLM',
      label: 'XLM',
      needsTrustline: false,
      trustlineAddress: nativeSacContractId(network),
      trustlineSymbol: 'XLM',
      networks: ['testnet', 'mainnet'],
      hasClawbackRisk: false,
    },
  ];

  if (network === 'mainnet') {
    list.push({
      code: 'USDT0',
      label: 'USDT0',
      needsTrustline: true,
      trustlineAddress: USDT0_ISSUER_MAINNET,
      trustlineSymbol: 'USDT0',
      networks: ['mainnet'],
      hasClawbackRisk: true,
    });
  }

  return list;
}

export function listSelectableSettlementAssets(): SettlementAssetMeta[] {
  return settlementAssetsForNetwork(getStellarNetwork());
}

export function isSettlementAsset(value: string): value is SettlementAsset {
  return (SETTLEMENT_ASSET_VALUES as readonly string[]).includes(
    value.toUpperCase(),
  );
}

export function normalizeSettlementAsset(value: string): SettlementAsset {
  const code = value.toUpperCase();
  if (!isSettlementAsset(code)) {
    throw new Error(`Unsupported settlement asset: ${value}`);
  }
  return code;
}

export function getSettlementAssetMeta(
  asset: SettlementAsset,
): SettlementAssetMeta {
  const network = getStellarNetwork();
  const meta = settlementAssetsForNetwork(network).find((a) => a.code === asset);
  if (!meta) {
    throw new Error(
      `${asset} is not available on ${network}. Try USDC or XLM on testnet.`,
    );
  }
  return meta;
}

export function trustlinePayloadForAsset(asset: SettlementAsset): {
  address: string;
  symbol: string;
} {
  const meta = getSettlementAssetMeta(asset);
  return {
    address: meta.trustlineAddress,
    symbol: meta.trustlineSymbol,
  };
}

/** Example fiat price per 1 unit of asset (form placeholders). */
export function examplePriceForAsset(
  fiatCurrency: string,
  asset: SettlementAsset,
): string {
  const fiat = fiatCurrency.toUpperCase();
  const marketExamples: Record<string, string> = {
    CRC: '520',
    ARS: '1100',
    BOB: '6.90',
    CLP: '950',
    COP: '4100',
    BRL: '5.50',
  };
  const base = marketExamples[fiat] ?? '1';
  if (asset === 'XLM') {
    const n = Number(base);
    if (Number.isFinite(n) && n > 0) {
      return String(Math.max(0.01, Math.round((n / 25) * 100) / 100));
    }
    return '0.25';
  }
  return base;
}

export function buyerActionLabelForAsset(
  side: 'sell_usdc' | 'buy_usdc',
  asset: SettlementAsset,
): string {
  if (side === 'sell_usdc') {
    return `Buy ${asset}`;
  }
  return `Sell ${asset}`;
}

export function formatAmountWithAsset(
  value: string | number,
  asset: SettlementAsset,
): string {
  const n = Number(value);
  const formatted = Number.isFinite(n)
    ? new Intl.NumberFormat('en-US', {
        maximumFractionDigits: asset === 'XLM' ? 4 : n >= 100 ? 0 : 2,
      }).format(n)
    : String(value);
  return `${formatted}\u00a0${asset}`;
}

export function formatPricePerUnit(
  fiatCurrency: string,
  price: string | number,
  asset: SettlementAsset,
): string {
  const n = Number(price);
  if (!Number.isFinite(n)) {
    return `${price}\u00a0${fiatCurrency}`;
  }
  const formatted = new Intl.NumberFormat('en-US', {
    maximumFractionDigits: n >= 100 ? 2 : 4,
  }).format(n);
  return `${formatted}\u00a0${fiatCurrency} / ${asset}`;
}
