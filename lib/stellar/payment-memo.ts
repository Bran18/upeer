/** Stellar transaction memo (classic payments). Text memos are max 28 bytes. */

export type PaymentMemoKind = 'none' | 'text' | 'id';

export type PaymentMemoInput = {
  kind: PaymentMemoKind;
  value: string;
};

export function buildPaymentMemoOptions(
  input: PaymentMemoInput,
): { memo: { type: 'text'; value: string } | { type: 'id'; value: string } } | undefined {
  if (input.kind === 'none') {
    return undefined;
  }
  const trimmed = input.value.trim();
  if (!trimmed) {
    return undefined;
  }
  if (input.kind === 'text') {
    const bytes = new TextEncoder().encode(trimmed);
    if (bytes.length > 28) {
      throw new Error('Memo text must be 28 bytes or fewer (Stellar limit).');
    }
    return { memo: { type: 'text', value: trimmed } };
  }
  if (!/^\d+$/.test(trimmed)) {
    throw new Error('Memo ID must be a whole number.');
  }
  const id = Number(trimmed);
  if (!Number.isSafeInteger(id) || id < 0) {
    throw new Error('Memo ID is out of range.');
  }
  return { memo: { type: 'id', value: trimmed } };
}

const PAYMENT_DESTINATION = /^(G|M)[A-Z2-7]{55,69}$/;

export function isStellarPaymentDestination(value: string): boolean {
  const v = value.trim();
  if (v.startsWith('G') && v.length === 56) {
    return PAYMENT_DESTINATION.test(v);
  }
  if (v.startsWith('M') && v.length === 69) {
    return PAYMENT_DESTINATION.test(v);
  }
  return false;
}
