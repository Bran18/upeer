import type { PostOrderStep } from '@/components/orders/post-order-step-nav';
import { postOrderSizeFieldError } from '@/components/orders/post-order-size-fields';
import type { PostOrderSide } from '@/components/orders/post-order-side-pills';

const STELLAR_G_REGEX = /^G[ABCDEFGHIJKLMNOPQRSTUVWXYZ234567]{55}$/;

export type PostOrderFormState = {
  side: PostOrderSide;
  fiatCurrency: string;
  pricePerUsdc: string;
  minUsdc: string;
  maxUsdc: string;
  availableUsdc: string;
  payoutAddress: string;
};

export function validatePostOrderStep(
  step: PostOrderStep,
  form: PostOrderFormState,
  payoutReady: boolean,
  payoutDraft: string,
): string | null {
  if (step === 1) {
    const price = Number(form.pricePerUsdc);
    if (!Number.isFinite(price) || price <= 0) {
      return 'Enter a valid price per USDC (greater than zero).';
    }
    return null;
  }
  if (step === 2) {
    return postOrderSizeFieldError({
      availableUsdc: form.availableUsdc,
      minUsdc: form.minUsdc,
      maxUsdc: form.maxUsdc,
    });
  }
  if (step === 3) {
    if (!payoutReady) {
      return 'Set a valid Stellar payout address (G…, 56 characters).';
    }
    if (payoutDraft && !STELLAR_G_REGEX.test(payoutDraft)) {
      return 'Payout address must be a valid Stellar public key.';
    }
    return null;
  }
  const price = Number(form.pricePerUsdc);
  if (!Number.isFinite(price) || price <= 0) {
    return 'Enter a valid price per USDC (greater than zero).';
  }
  const sizeError = postOrderSizeFieldError({
    availableUsdc: form.availableUsdc,
    minUsdc: form.minUsdc,
    maxUsdc: form.maxUsdc,
  });
  if (sizeError) {
    return sizeError;
  }
  if (!payoutReady) {
    return 'Set a valid Stellar payout address (G…, 56 characters).';
  }
  if (payoutDraft && !STELLAR_G_REGEX.test(payoutDraft)) {
    return 'Payout address must be a valid Stellar public key.';
  }
  return null;
}

export function minUsdcForApi(value: string): string {
  const n = Number(value);
  if (!Number.isFinite(n)) {
    return value;
  }
  return n.toFixed(7);
}

export function maxUsdcForApi(value: string): string {
  return minUsdcForApi(value);
}
