import { z } from 'zod';
import { p2pLegs, type OfferSide } from '@/lib/escrow/p2p-legs';
import {
  normalizePaymentPrefs,
  paymentMethodSchema,
  type FiatPaymentMethod,
} from '@/lib/profile/payment-prefs';

export const fiatSettlementMethodSchema = paymentMethodSchema;

export const fiatSettlementSnapshotSchema = z.object({
  profileId: z.string().uuid(),
  selectedAt: z.string().min(1),
  method: fiatSettlementMethodSchema,
});

export type FiatSettlementSnapshot = z.infer<typeof fiatSettlementSnapshotSchema>;

export function usdcSellerProfileId(
  side: OfferSide,
  makerProfileId: string,
  takerProfileId: string,
): string {
  return p2pLegs({
    side,
    makerProfileId,
    takerProfileId,
    makerPayoutAddress: null,
    takerStellarAddress: null,
  }).usdcSellerProfileId;
}

export function resolveSellerPaymentMethod(
  paymentPrefsRaw: unknown,
  paymentMethodId: string,
  fiatCurrency: string,
  sellerProfileId: string,
): FiatSettlementSnapshot {
  const prefs = normalizePaymentPrefs(paymentPrefsRaw);
  const currency = fiatCurrency.toUpperCase();
  const method = prefs.methods.find(
    (m) => m.id === paymentMethodId && m.currency === currency,
  );
  if (!method) {
    throw new Error(
      `Choose a saved payment method in ${currency} for this trade.`,
    );
  }
  const parsed = paymentMethodSchema.safeParse(method);
  if (!parsed.success) {
    throw new Error(
      parsed.error.issues[0]?.message ??
        'Complete this payment method in settings before trading.',
    );
  }
  return {
    profileId: sellerProfileId,
    selectedAt: new Date().toISOString(),
    method: parsed.data,
  };
}

export function parseFiatSettlement(raw: unknown): FiatSettlementSnapshot | null {
  const parsed = fiatSettlementSnapshotSchema.safeParse(raw);
  return parsed.success ? parsed.data : null;
}

export function usdcReleaseAddressForOrder(
  side: OfferSide,
  makerPayoutAddress: string | null,
  takerStellarAddress: string | null,
): string | null {
  const legs = p2pLegs({
    side,
    makerProfileId: '',
    takerProfileId: '',
    makerPayoutAddress,
    takerStellarAddress,
  });
  return legs.usdcBuyerAddress;
}
