import { formatUsdcAmount } from '@/lib/market/format';
import type {
  PostOrderFormState,
  PostOrderSizeValues,
  PostOrderStep,
} from '@/lib/orders/post-order-types';

const STELLAR_G_REGEX = /^G[ABCDEFGHIJKLMNOPQRSTUVWXYZ234567]{55}$/;

function parsePositive(value: string): number | null {
  const n = Number(value);
  if (!Number.isFinite(n) || n <= 0) {
    return null;
  }
  return n;
}

export function postOrderSizeFieldError(values: PostOrderSizeValues): string | null {
  const available = parsePositive(values.availableUsdc);
  const min = parsePositive(values.minUsdc);
  const max = parsePositive(values.maxUsdc);
  if (available === null) {
    return 'Enter how much USDC you want on this listing (greater than zero).';
  }
  if (min === null) {
    return 'Enter the smallest trade size you will accept.';
  }
  if (max === null) {
    return 'Enter the largest trade size you will accept.';
  }
  if (min > max) {
    return 'Smallest trade cannot be larger than the largest.';
  }
  if (max > available) {
    return `Largest trade cannot exceed your listing total (${formatUsdcAmount(values.availableUsdc)} USDC).`;
  }
  return null;
}

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
