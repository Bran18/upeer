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
    <section className="panel-card">
      <h2 className="text-headline">Soroswap (Adjacent)</h2>
      <p className="text-body mt-2 text-sm">
        Fund your wallet with USDC via Soroswap. This does not complete an OTC
        order or move escrow state.
      </p>
      <label className="field-label mt-5" htmlFor="swap-xlm-amount">
        XLM amount (stroops)
      </label>
      <input
        id="swap-xlm-amount"
        name="amount"
        type="text"
        inputMode="numeric"
        spellCheck={false}
        autoComplete="off"
        className="field-input max-w-xs font-mono text-sm tabular-nums"
        value={amount}
        onChange={(e) => setAmount(e.target.value)}
      />
      <button
        type="button"
        disabled={disabled || busy}
        onClick={() => void runSwap()}
        className="btn-primary mt-4"
      >
        {busy ? 'Swapping…' : 'Quote & Swap XLM → USDC'}
      </button>
      {status ? (
        <p className="mt-3 text-sm text-muted" role="status" aria-live="polite">
          {status}
        </p>
      ) : null}
    </section>
  );
}
