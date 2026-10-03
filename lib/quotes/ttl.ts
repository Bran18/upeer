/** How long a quote can sit unused before it can be turned into an order. */
export const QUOTE_TTL_MS = 5 * 60 * 1000;

/** How long a desk has to accept after a take is opened. */
export const ACCEPTANCE_TTL_MS = 24 * 60 * 60 * 1000;

export function quoteCreateDeadline(fromMs = Date.now()): Date {
  return new Date(fromMs + QUOTE_TTL_MS);
}

export function acceptanceDeadline(
  orderCreatedAt: string,
  quoteExpiresAt: string,
): Date {
  const fromQuote = new Date(quoteExpiresAt).getTime();
  const fromOrder = new Date(orderCreatedAt).getTime() + ACCEPTANCE_TTL_MS;
  const quoteOk = Number.isFinite(fromQuote) ? fromQuote : 0;
  const orderOk = Number.isFinite(fromOrder) ? fromOrder : 0;
  return new Date(Math.max(quoteOk, orderOk));
}

export function isPast(deadline: Date, now = Date.now()): boolean {
  return deadline.getTime() <= now;
}

export function isWithinAcceptanceWindow(
  orderCreatedAt: string,
  quoteExpiresAt: string,
  now = Date.now(),
): boolean {
  return !isPast(acceptanceDeadline(orderCreatedAt, quoteExpiresAt), now);
}

/** Cancelled is only used for quote-TTL rejects; those takes can still be accepted in-window. */
export function orderCanBeAccepted(
  status: string,
  orderCreatedAt: string,
  quoteExpiresAt: string,
  now = Date.now(),
): boolean {
  if (status !== 'pending_acceptance' && status !== 'cancelled') {
    return false;
  }
  return isWithinAcceptanceWindow(orderCreatedAt, quoteExpiresAt, now);
}

