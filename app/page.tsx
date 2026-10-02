import Link from 'next/link';

export default function HomePage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6">
      <p className="text-sm font-medium text-emerald-700 dark:text-emerald-400">
        P2P commercial infrastructure
      </p>
      <h1 className="mt-3 text-4xl font-semibold tracking-tight">
        USDC OTC on Stellar, with escrow you can verify
      </h1>
      <p className="mt-4 text-lg text-zinc-600 dark:text-zinc-400">
        UPEER connects buyers with verified merchants, prices trades with
        Reflector references, and settles the digital leg through Trustless Work
        single-release escrow.
      </p>
      <div className="mt-8 flex flex-wrap gap-3">
        <Link
          href="/market"
          className="rounded-lg bg-emerald-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-emerald-700"
        >
          Browse market
        </Link>
        <Link
          href="/app"
          className="rounded-lg border border-zinc-300 px-5 py-2.5 text-sm font-medium dark:border-zinc-700"
        >
          Open console
        </Link>
      </div>
      <section className="mt-14 space-y-6 text-sm text-zinc-600 dark:text-zinc-400">
        <div>
          <h2 className="font-semibold text-zinc-900 dark:text-zinc-100">
            How a trade works
          </h2>
          <ol className="mt-2 list-decimal space-y-1 pl-5">
            <li>Pick a verified merchant offer in your fiat currency.</li>
            <li>Lock an executable quote (Reflector reference + spread).</li>
            <li>Fund Trustless Work escrow for the USDC leg.</li>
            <li>Complete fiat off-chain; platform confirms per policy.</li>
            <li>Release USDC when milestones are approved.</li>
          </ol>
        </div>
        <p>
          Optional Soroswap swaps help you fund USDC in your wallet—they do not
          replace OTC settlement.
        </p>
      </section>
    </div>
  );
}
