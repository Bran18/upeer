/**
 * UPEER P2P coverage: Costa Rica, Argentina, Bolivia, Chile, Colombia.
 */

export type UpeerCountryCode = 'CR' | 'AR' | 'BO' | 'CL' | 'CO';

export type UpeerMarket = {
  code: UpeerCountryCode;
  name: string;
  currency: string;
  /** Example price per 1 USDC for form placeholders */
  examplePricePerUsdc: string;
};

export const UPEER_MARKETS: readonly UpeerMarket[] = [
  {
    code: 'CR',
    name: 'Costa Rica',
    currency: 'CRC',
    examplePricePerUsdc: '520',
  },
  {
    code: 'AR',
    name: 'Argentina',
    currency: 'ARS',
    examplePricePerUsdc: '1100',
  },
  {
    code: 'BO',
    name: 'Bolivia',
    currency: 'BOB',
    examplePricePerUsdc: '6.90',
  },
  {
    code: 'CL',
    name: 'Chile',
    currency: 'CLP',
    examplePricePerUsdc: '950',
  },
  {
    code: 'CO',
    name: 'Colombia',
    currency: 'COP',
    examplePricePerUsdc: '4100',
  },
] as const;

export const UPEER_FIAT_CURRENCIES = UPEER_MARKETS.map((m) => m.currency);

export const DEFAULT_FIAT_CURRENCY = UPEER_MARKETS[0].currency;

export function isSupportedFiatCurrency(value: string): boolean {
  return UPEER_FIAT_CURRENCIES.includes(value.toUpperCase());
}

export function marketForCurrency(currency: string): UpeerMarket | undefined {
  const code = currency.toUpperCase();
  return UPEER_MARKETS.find((m) => m.currency === code);
}

export function marketForCountry(countryCode: string): UpeerMarket | undefined {
  const code = countryCode.toUpperCase() as UpeerCountryCode;
  return UPEER_MARKETS.find((m) => m.code === code);
}

export const PAYMENT_RAIL_VALUES = [
  'sinpe',
  'bank_transfer',
  'cvu_cbu',
  'mercado_pago',
  'nequi',
  'daviplata',
  'yape',
  'chile_wallet',
  'cash',
  'other',
] as const;

export type PaymentRail = (typeof PAYMENT_RAIL_VALUES)[number];

export type PaymentRailOption = {
  value: PaymentRail;
  label: string;
  /** Empty = all markets */
  countryCodes: readonly UpeerCountryCode[];
};

export const PAYMENT_RAIL_OPTIONS: readonly PaymentRailOption[] = [
  {
    value: 'sinpe',
    label: 'SINPE Móvil',
    countryCodes: ['CR'],
  },
  {
    value: 'bank_transfer',
    label: 'Bank account',
    countryCodes: ['CR', 'BO', 'CL', 'CO'],
  },
  {
    value: 'cvu_cbu',
    label: 'CBU / CVU / alias',
    countryCodes: ['AR'],
  },
  {
    value: 'mercado_pago',
    label: 'Mercado Pago',
    countryCodes: ['AR'],
  },
  {
    value: 'nequi',
    label: 'Nequi',
    countryCodes: ['CO'],
  },
  {
    value: 'daviplata',
    label: 'Daviplata',
    countryCodes: ['CO'],
  },
  {
    value: 'yape',
    label: 'Yape',
    countryCodes: ['BO'],
  },
  {
    value: 'chile_wallet',
    label: 'MACH / Tenpo',
    countryCodes: ['CL'],
  },
  {
    value: 'cash',
    label: 'Cash in person',
    countryCodes: [],
  },
  {
    value: 'other',
    label: 'Other',
    countryCodes: [],
  },
];

const LEGACY_RAIL_MAP: Record<string, PaymentRail> = {
  pix: 'other',
  spei: 'other',
  pse: 'bank_transfer',
  nequi_daviplata: 'nequi',
  mobile_wallet: 'other',
};

export function defaultRailForCurrency(currency: string): PaymentRail {
  switch (currency.toUpperCase()) {
    case 'CRC':
      return 'sinpe';
    case 'ARS':
      return 'mercado_pago';
    case 'BOB':
      return 'yape';
    case 'CLP':
      return 'bank_transfer';
    case 'COP':
      return 'nequi';
    default:
      return 'bank_transfer';
  }
}

export function coercePaymentRail(value: string): PaymentRail {
  if (LEGACY_RAIL_MAP[value]) {
    return LEGACY_RAIL_MAP[value];
  }
  if ((PAYMENT_RAIL_VALUES as readonly string[]).includes(value)) {
    return value as PaymentRail;
  }
  return 'other';
}

export function railsForCurrency(currency: string): PaymentRailOption[] {
  const market = marketForCurrency(currency);
  if (!market) {
    return PAYMENT_RAIL_OPTIONS.filter((r) => r.countryCodes.length === 0);
  }
  return PAYMENT_RAIL_OPTIONS.filter(
    (rail) =>
      rail.countryCodes.length === 0 ||
      rail.countryCodes.includes(market.code),
  );
}

export function formatMarketLabel(market: UpeerMarket): string {
  return `${market.name} (${market.currency})`;
}

export function formatFiatBadge(currency: string): string {
  const market = marketForCurrency(currency);
  if (!market) {
    return currency;
  }
  return `${market.name} · ${market.currency}`;
}

export const UPEER_COVERAGE_BLURB =
  'Costa Rica, Argentina, Bolivia, Chile, and Colombia';
