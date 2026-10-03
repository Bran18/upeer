const STROOPS_PER_XLM = 10_000_000;

/** User-facing XLM string → stroops for Soroswap API. */
export function xlmToStroops(xlm: string): string {
  const n = Number(xlm.replace(/,/g, '').trim());
  if (!Number.isFinite(n) || n <= 0) {
    throw new Error('Enter a valid XLM amount');
  }
  return String(Math.round(n * STROOPS_PER_XLM));
}

export function formatXlmHint(stroops: string): string {
  const n = Number(stroops);
  if (!Number.isFinite(n)) {
    return stroops;
  }
  return (n / STROOPS_PER_XLM).toLocaleString('en-US', {
    maximumFractionDigits: 2,
  });
}
