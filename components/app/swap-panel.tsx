'use client';

import { usePollar } from '@pollar/react';
import { useState } from 'react';
import { getNetworkConfigClient } from '@/lib/config/network-client';

type Props = {
  disabled: boolean;
};

export function SwapPanel({ disabled }: Props) {
  const { signAndSubmitTx, wallet } = usePollar();
  const [amount, setAmount] = useState('10000000');
  const [status, setStatus] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const tokens = getNetworkConfigClient();

  const runSwap = async () => {
    if (!wallet?.address) {
      return;
    }
    setBusy(true);
    setStatus(null);
    try {
      const quoteRes = await fetch('/api/swap/quote', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          assetIn: tokens.xlmSac,
          assetOut: tokens.usdcSac,
          amount,
        }),
      });
      const quote = await quoteRes.json();
      if (!quoteRes.ok) {
        throw new Error(quote.error ?? 'Quote failed');
      }

      const buildRes = await fetch('/api/swap/build', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ quote, from: wallet.address }),
      });
      const built = await buildRes.json();
      if (!buildRes.ok) {
        throw new Error(built.error ?? 'Build failed');
      }

      const outcome = await signAndSubmitTx(built.xdr);
      if (outcome.status === 'success') {
        setStatus(`Swap submitted: ${outcome.hash}`);
      } else if (outcome.status === 'error') {
        setStatus(
          'message' in outcome && typeof outcome.message === 'string'
            ? outcome.message
            : 'Swap failed',
        );
      } else {
        setStatus(`Swap pending: ${outcome.hash}`);
      }
    } catch (error) {
      setStatus(error instanceof Error ? error.message : 'Swap failed');
    } finally {
      setBusy(false);
    }
  };

  return (
    <section className="rounded-xl border border-zinc-200 p-6 dark:border-zinc-800">
      <h2 className="font-semibold">Soroswap (adjacent)</h2>
      <p className="mt-1 text-sm text-zinc-500">
        Fund your wallet with USDC via Soroswap. This does not complete an OTC
        order or move escrow state.
      </p>
      <label className="mt-4 block text-sm">
        XLM amount (stroops)
        <input
          className="mt-1 w-full max-w-xs rounded-lg border border-zinc-300 px-3 py-2 font-mono text-sm dark:border-zinc-700 dark:bg-zinc-950"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
        />
      </label>
      <button
        type="button"
        disabled={disabled || busy}
        onClick={() => void runSwap()}
        className="mt-4 rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white disabled:opacity-50 dark:bg-zinc-100 dark:text-zinc-900"
      >
        Quote & swap XLM → USDC
      </button>
      {status ? (
        <p className="mt-3 text-sm text-zinc-600 dark:text-zinc-400">{status}</p>
      ) : null}
    </section>
  );
}
