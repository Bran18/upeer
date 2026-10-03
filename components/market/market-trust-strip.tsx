const ITEMS = [
  {
    title: 'Your price',
    body: 'Orders list fiat per USDC—no hidden formulas on the book.',
  },
  {
    title: 'Take or post',
    body: 'Create an order as a merchant or take someone else’s open order.',
  },
  {
    title: 'Escrow on Stellar',
    body: 'USDC legs use Trustless Work; fiat stays peer-to-peer.',
  },
] as const;

export function MarketTrustStrip() {
  return (
    <section
      className="border-b border-[var(--line)] bg-[var(--fill)]"
      aria-label="How the P2P market works"
    >
      <div className="page-shell py-6">
        <ul className="grid gap-4 sm:grid-cols-3">
          {ITEMS.map((item) => (
            <li key={item.title} className="min-w-0">
              <p className="text-sm font-medium">{item.title}</p>
              <p className="mt-1 text-sm leading-relaxed text-[var(--foreground-secondary)] text-pretty">
                {item.body}
              </p>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
