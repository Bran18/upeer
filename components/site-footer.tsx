export function SiteFooter() {
  return (
    <footer className="border-t border-[var(--line)] py-10 text-center">
      <p className="font-mono text-[10px] uppercase tracking-[0.25em] text-[var(--muted)]">
        Testnet · Fiat off-chain · Escrow on Stellar
      </p>
      <p className="mt-2 text-xs text-[var(--muted)]">
        Declarations do not confirm payment. Use at your own risk.
      </p>
    </footer>
  );
}
