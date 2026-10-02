/** Pollar may return ISO strings, epoch seconds, or epoch milliseconds. */
export function parseExpiresAt(value: string | number | undefined): Date {
  if (value === undefined || value === null || value === '') {
    return new Date(Date.now() + 24 * 60 * 60 * 1000);
  }

  if (typeof value === 'number' && Number.isFinite(value)) {
    const ms = value < 1e12 ? value * 1000 : value;
    const date = new Date(ms);
    if (!Number.isNaN(date.getTime())) {
      return date;
    }
  }

  const asString = String(value);
  const asDate = new Date(asString);
  if (!Number.isNaN(asDate.getTime())) {
    return asDate;
  }

  const asNum = Number(asString);
  if (Number.isFinite(asNum)) {
    const ms = asNum < 1e12 ? asNum * 1000 : asNum;
    const date = new Date(ms);
    if (!Number.isNaN(date.getTime())) {
      return date;
    }
  }

  return new Date(Date.now() + 24 * 60 * 60 * 1000);
}
