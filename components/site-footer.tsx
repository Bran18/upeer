export function SiteFooter() {
  return (
    <footer className="border-t border-[var(--line)] bg-[var(--background-secondary)] px-6 py-10">
      <div className="mx-auto max-w-[980px] text-center">
        <p className="text-caption">
          Testnet only · Fiat settles off-chain · Escrow on Stellar
        </p>
        <p className="text-caption mt-2">
          Declarations do not confirm payment.
        </p>
      </div>
    </footer>
  );
}
