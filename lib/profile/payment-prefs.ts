import { z } from 'zod';
import {
  coercePaymentRail,
  defaultRailForCurrency,
  PAYMENT_RAIL_VALUES,
  UPEER_FIAT_CURRENCIES,
  type PaymentRail,
} from '@/lib/fiat/coverage';
import {
  emptyDetails,
  sanitizeDetails,
  validateRailDetails,
  type PaymentDetails,
} from '@/lib/fiat/rail-details';

const detailsSchema = z.object({
  phone: z.string().max(20).optional(),
  iban: z.string().max(28).optional(),
  alias: z.string().max(20).optional(),
  cbuCvu: z.string().max(22).optional(),
  cvu: z.string().max(22).optional(),
  bankName: z.string().max(80).optional(),
  accountType: z.string().max(24).optional(),
  accountNumber: z.string().max(32).optional(),
  rut: z.string().max(16).optional(),
  nationalId: z.string().max(24).optional(),
  documentType: z.string().max(8).optional(),
  documentNumber: z.string().max(20).optional(),
  pixKeyType: z.string().max(12).optional(),
  pixKey: z.string().max(80).optional(),
  email: z.string().max(80).optional(),
  wallet: z.string().max(24).optional(),
  meetingPlace: z.string().max(200).optional(),
  destination: z.string().max(200).optional(),
  note: z.string().max(400).optional(),
});

export const paymentMethodSchema = z
  .object({
    id: z.string().min(8).max(64),
    rail: z.enum(PAYMENT_RAIL_VALUES),
    currency: z
      .string()
      .min(3)
      .max(4)
      .toUpperCase()
      .refine((c) => UPEER_FIAT_CURRENCIES.includes(c), {
        message: 'Currency must be CRC, ARS, BOB, CLP, COP, or BRL',
      }),
    holderName: z.string().min(2).max(80),
    details: detailsSchema.default({}),
  })
  .superRefine((method, ctx) => {
    const error = validateRailDetails(
      method.rail,
      method.currency,
      method.details,
      method.holderName,
    );
    if (error) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: error });
    }
  });

export const paymentPrefsSchema = z.object({
  primaryMethodId: z.string().nullable().optional(),
  methods: z.array(paymentMethodSchema).max(8),
});

export type FiatPaymentMethod = z.infer<typeof paymentMethodSchema>;
export type PaymentPrefs = z.infer<typeof paymentPrefsSchema>;

export const EMPTY_PAYMENT_PREFS: PaymentPrefs = { methods: [] };

type LegacyMethod = {
  id?: unknown;
  rail?: unknown;
  currency?: unknown;
  holderName?: unknown;
  details?: unknown;
  label?: unknown;
  instructions?: unknown;
};

function coerceDetails(raw: unknown): PaymentDetails {
  if (!raw || typeof raw !== 'object') {
    return emptyDetails();
  }
  const out: PaymentDetails = {};
  for (const [key, value] of Object.entries(raw as Record<string, unknown>)) {
    if (typeof value === 'string' && value.trim()) {
      out[key as keyof PaymentDetails] = value;
    }
  }
  return out;
}

function normalizeMethod(raw: LegacyMethod): FiatPaymentMethod | null {
  if (typeof raw.id !== 'string' || raw.id.length < 8) {
    return null;
  }
  const currency =
    typeof raw.currency === 'string' ? raw.currency.toUpperCase() : '';
  if (!UPEER_FIAT_CURRENCIES.includes(currency)) {
    return null;
  }
  const rail: PaymentRail = coercePaymentRail(
    typeof raw.rail === 'string' ? raw.rail : defaultRailForCurrency(currency),
  );
  const holderName =
    (typeof raw.holderName === 'string' && raw.holderName.trim()) ||
    (typeof raw.label === 'string' && raw.label.trim()) ||
    '';
  const details = coerceDetails(raw.details);
  if (typeof raw.instructions === 'string' && raw.instructions.trim()) {
    if (!details.note) {
      details.note = raw.instructions.trim();
    }
    if (rail === 'sinpe' && !details.phone) {
      const digits = raw.instructions.replace(/\D/g, '');
      if (digits.length === 8) {
        details.phone = digits;
      }
    }
    if (rail === 'mercado_pago' && !details.alias) {
      const token = raw.instructions.trim().split(/\s+/)[0] ?? '';
      if (token.length >= 6 && token.length <= 20) {
        details.alias = token;
      }
    }
  }

  const draft = {
    id: raw.id,
    rail,
    currency,
    holderName: holderName || 'Account holder',
    details: sanitizeDetails(rail, currency, details),
  };

  const parsed = paymentMethodSchema.safeParse(draft);
  if (parsed.success) {
    return parsed.data;
  }

  return {
    ...draft,
    details: sanitizeDetails(rail, currency, details),
  };
}

export function normalizePaymentPrefs(raw: unknown): PaymentPrefs {
  if (!raw || typeof raw !== 'object') {
    return EMPTY_PAYMENT_PREFS;
  }
  const obj = raw as { primaryMethodId?: unknown; methods?: unknown };
  if (!Array.isArray(obj.methods)) {
    return EMPTY_PAYMENT_PREFS;
  }
  const methods = obj.methods
    .map((item) => normalizeMethod(item as LegacyMethod))
    .filter((item): item is FiatPaymentMethod => item != null)
    .slice(0, 8);

  let primaryMethodId =
    typeof obj.primaryMethodId === 'string' ? obj.primaryMethodId : null;
  if (primaryMethodId && !methods.some((m) => m.id === primaryMethodId)) {
    primaryMethodId = methods[0]?.id ?? null;
  }
  if (!primaryMethodId && methods.length === 1) {
    primaryMethodId = methods[0].id;
  }
  return { primaryMethodId, methods };
}

export function createEmptyPaymentMethod(currency: string): FiatPaymentMethod {
  const rail = defaultRailForCurrency(currency);
  return {
    id: crypto.randomUUID(),
    rail,
    currency,
    holderName: '',
    details: emptyDetails(),
  };
}
