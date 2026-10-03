'use client';

import Link from 'next/link';
import { usePollar } from '@pollar/react';
import { useCallback, useEffect, useState } from 'react';
import {
  getNetworkConfigClient,
  getStellarNetworkClient,
} from '@/lib/config/network-client';
import { xlmToStroops } from '@/lib/swap/xlm-amount';
import { cn } from '@/lib/cn';

const PRESET_XLM = ['5', '10', '25', '100'] as const;

type Props = {
  disabled?: boolean;
};

export function SoroswapSection({ disabled = false }: Props) {
  const { signAndSubmitTx, wallet, isAuthenticated, verified } = usePollar();
  const [xlmAmount, setXlmAmount] = useState('10');
  const [status, setStatus] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [swapReady, setSwapReady] = useState<boolean | null>(null);
  const tokens = getNetworkConfigClient();
  const isTestnet = getStellarNetworkClient() === 'testnet';

  useEffect(() => {
    void fetch('/api/health')
      .then((r) => r.json())
      .then((data) => setSwapReady(Boolean(data?.integrations?.soroswap)))
      .catch(() => setSwapReady(false));
  }, []);

  const runSwap = useCallback(async () => {
    if (!wallet?.address) {
      setStatus('Connect your wallet with Sign in first.');
      return;
    }
    setBusy(true);
    setStatus(null);
    try {
      const amount = xlmToStroops(xlmAmount);
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
        throw new Error(quote.error ?? 'Could not get a price. Try again.');
      }

      const buildRes = await fetch('/api/swap/build', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ quote, from: wallet.address }),
      });
      const built = await buildRes.json();
      if (!buildRes.ok) {
        throw new Error(built.error ?? 'Could not prepare the swap.');
      }

      setStatus('Confirm the transaction in your wallet…');
      const outcome = await signAndSubmitTx(built.xdr);
      if (outcome.status === 'success') {
        setStatus(
          `Done. USDC should arrive in your wallet shortly. (Tx ${outcome.hash.slice(0, 8)}…)`,
        );
      } else if (outcome.status === 'error') {
        setStatus(
          'message' in outcome && typeof outcome.message === 'string'
            ? outcome.message
            : 'Swap was not completed.',
        );
      } else {
        setStatus(`Submitted — check your wallet for status.`);
      }
    } catch (error) {
      setStatus(error instanceof Error ? error.message : 'Swap failed');
    } finally {
      setBusy(false);
    }
  }, [wallet?.address, xlmAmount, tokens, signAndSubmitTx]);

  const runMintUsdc = useCallback(async () => {
    if (!wallet?.address) {
      setStatus('Connect your wallet with Sign in first.');
      return;
    }
    setBusy(true);
    setStatus(null);
    try {
      const res = await fetch('/api/swap/faucet', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ address: wallet.address }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error ?? 'Could not mint test USDC.');
      }
      setStatus(
        `Minted test USDC to your wallet. (Tx ${String(data.txHash).slice(0, 8)}…)`,
      );
    } catch (error) {
      setStatus(error instanceof Error ? error.message : 'Mint failed');
    } finally {
      setBusy(false);
    }
  }, [wallet?.address]);

  const canSwap = isAuthenticated && verified && !disabled && swapReady !== false;

  return (
    <section
      id="fund"
      className="scroll-mt-[calc(var(--site-header-height)+1rem)]"
      aria-labelledby="fund-title"
    >
      <h2 id="fund-title" className="text-sm font-medium">
        Get USDC
      </h2>
      <p className="mt-1 text-sm text-[var(--foreground-secondary)] text-pretty">
        {isTestnet
          ? 'Mint test USDC into this wallet so you can complete a protected exchange. This is not a P2P trade.'
          : 'Swap XLM into USDC in this wallet. This is not a P2P trade.'}
      </p>

      <div className="mt-5 space-y-4">
        {swapReady === false ? (
          <p className="text-sm text-[var(--foreground-secondary)]">
            Funding is not configured on this server.
          </p>
        ) : null}

        {isTestnet ? null : (
          <div>
            <label className="field-label" htmlFor="soroswap-xlm">
              XLM to swap
            </label>
            <div className="mt-2 flex flex-wrap gap-1">
              {PRESET_XLM.map((preset) => (
                <button
                  key={preset}
                  type="button"
                  onClick={() => setXlmAmount(preset)}
                  className={cn(
                    'nav-pill min-h-9 px-3 tabular-nums',
                    xlmAmount === preset && 'nav-pill--active',
                  )}
                >
                  {preset}
                </button>
              ))}
            </div>
            <input
              id="soroswap-xlm"
              name="xlmAmount"
              type="text"
              inputMode="decimal"
              autoComplete="off"
              spellCheck={false}
              className="field-input mt-3 tabular-nums"
              value={xlmAmount}
              onChange={(e) => setXlmAmount(e.target.value)}
            />
          </div>
        )}

        {!isAuthenticated || !verified ? (
          <p className="text-sm text-[var(--foreground-secondary)]">
            Sign in to fund this wallet.
          </p>
        ) : null}

        <div className="flex flex-col gap-2 sm:flex-row">
          {isTestnet ? (
            <button
              type="button"
              disabled={!canSwap || busy}
              onClick={() => void runMintUsdc()}
              className="btn-primary"
            >
              {busy ? 'Working…' : 'Mint test USDC'}
            </button>
          ) : null}
          <button
            type="button"
            disabled={!canSwap || busy}
            onClick={() => void runSwap()}
            className={isTestnet ? 'btn-secondary' : 'btn-primary'}
          >
            {busy ? 'Working…' : 'Swap XLM for USDC'}
          </button>
        </div>

        {status ? (
          <p className="text-sm text-[var(--foreground-secondary)]" role="status" aria-live="polite">
            {status}
          </p>
        ) : null}

        <p className="text-sm text-[var(--foreground-tertiary)]">
          To exchange with a person, go to{' '}
          <Link href="/exchange" className="font-medium text-[var(--accent)] hover:underline">
            Exchange
          </Link>
          .
        </p>
      </div>
    </section>
  );
}
