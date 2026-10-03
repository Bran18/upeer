const ITEMS = [
  {
    title: 'On-chain escrow',
    body: 'USDC legs use Trustless Work milestones—not informal IOUs.',
  },
  {
    title: 'Reflector quotes',
    body: 'Reference price plus merchant spread, locked before you fund.',
  },
  {
    title: 'Verified desks',
    body: 'Merchants pass review before inventory goes live.',
  },
] as const;

export function MarketTrustStrip() {
  return (
    <section
      className="border-b border-[var(--line)] bg-[var(--fill)]"
      aria-label="How Upeer market works"
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
