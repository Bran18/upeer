'use client';

import Link from 'next/link';
import { usePollar } from '@pollar/react';
import { useCallback, useEffect, useState } from 'react';
import { getNetworkConfigClient } from '@/lib/config/network-client';
import { xlmToStroops } from '@/lib/swap/xlm-amount';
import { cn } from '@/lib/cn';

const PRESET_XLM = ['5', '10', '25', '100'] as const;

const STEPS = [
  {
    n: '1',
    title: 'You need USDC in your wallet',
    body: 'P2P trades lock USDC in escrow. If your balance is low, swap XLM to USDC here first.',
  },
  {
    n: '2',
    title: 'Choose how much XLM to swap',
    body: 'Pick a preset or type an amount. We handle the technical details when you confirm in your wallet.',
  },
  {
    n: '3',
    title: 'Go back to the market',
    body: 'After the swap succeeds, open Market or Orders to trade with another person.',
  },
] as const;

type Tab = 'swap' | 'help';

type Props = {
  disabled?: boolean;
};

export function SoroswapSection({ disabled = false }: Props) {
  const { signAndSubmitTx, wallet, isAuthenticated, verified } = usePollar();
  const [tab, setTab] = useState<Tab>('swap');
  const [xlmAmount, setXlmAmount] = useState('10');
  const [status, setStatus] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [swapReady, setSwapReady] = useState<boolean | null>(null);
  const tokens = getNetworkConfigClient();

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

  const canSwap = isAuthenticated && verified && !disabled && swapReady !== false;

  return (
    <section
      id="soroswap"
      className="scroll-mt-[calc(var(--site-header-height)+1rem)]"
      aria-labelledby="soroswap-title"
    >
      <div className="soroswap-hero">
        <div className="relative z-[1] max-w-xl">
          <p className="soroswap-hero-kicker">Wallet funding</p>
          <h2 id="soroswap-title" className="mt-2 text-2xl font-semibold tracking-tight sm:text-3xl">
            Get USDC with Soroswap
          </h2>
          <p className="mt-2 text-sm leading-relaxed text-white/85 text-pretty">
            Swap testnet XLM into USDC so you can fund escrow on P2P trades. This
            is separate from buying or selling with another person.
          </p>
        </div>
        <div className="soroswap-hero-art" aria-hidden>
          <span className="soroswap-hero-coin">XLM</span>
          <span className="soroswap-hero-arrow">→</span>
          <span className="soroswap-hero-coin soroswap-hero-coin--usdc">USDC</span>
        </div>
      </div>

      <div className="mt-4 flex flex-wrap gap-1 border-b border-[var(--line)] pb-px">
        {(
          [
            { id: 'swap' as Tab, label: 'Swap' },
            { id: 'help' as Tab, label: 'How it works' },
          ] as const
        ).map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => setTab(item.id)}
            className={cn(
              'rounded-t-[var(--radius-ui)] px-4 py-2.5 text-sm font-medium transition-colors',
              tab === item.id
                ? 'bg-[var(--surface-elevated)] text-[var(--foreground)] shadow-[inset_0_-1px_0_var(--surface-elevated)]'
                : 'text-[var(--foreground-secondary)] hover:text-[var(--foreground)]',
            )}
          >
            {item.label}
          </button>
        ))}
      </div>

      <div className="ui-card rounded-t-none border-t-0 px-5 py-6 sm:px-6">
        {swapReady === false ? (
          <p className="rounded-[var(--radius-ui)] border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-900 dark:text-amber-100">
            Soroswap is not configured on this server. Ask your operator to set{' '}
            <code className="text-xs">SOROSWAP_API_KEY</code>, or use{' '}
            <Link href="/app" className="font-medium underline">Developer tools</Link>{' '}
            to diagnose.
          </p>
        ) : null}

        {tab === 'help' ? (
          <ol className="grid gap-4 sm:grid-cols-3">
            {STEPS.map((step) => (
              <li
                key={step.n}
                className="rounded-[var(--radius-ui)] border border-[var(--line)] bg-[var(--fill)] p-4"
              >
                <p className="font-mono text-xs text-[var(--accent)]">{step.n}</p>
                <p className="mt-2 text-sm font-medium">{step.title}</p>
                <p className="mt-1 text-sm leading-relaxed text-[var(--foreground-secondary)] text-pretty">
                  {step.body}
                </p>
              </li>
            ))}
          </ol>
        ) : (
          <div className="mx-auto max-w-lg space-y-5">
            <p className="text-xs font-medium uppercase tracking-[0.14em] text-[var(--foreground-tertiary)]">
              Preferences
            </p>

            <div>
              <label className="field-label" htmlFor="soroswap-xlm">
                How much XLM do you want to swap?
              </label>
              <p className="mt-1 text-xs text-[var(--foreground-tertiary)]">
                Native Stellar lumens from your connected wallet (testnet).
              </p>
              <div className="mt-2 flex flex-wrap gap-2">
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
                    {preset} XLM
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
                placeholder="e.g. 10"
              />
            </div>

            <div className="rounded-[var(--radius-ui)] border border-[var(--line)] bg-[var(--fill)] px-4 py-3 text-sm text-[var(--foreground-secondary)] text-pretty">
              <strong className="font-medium text-[var(--foreground)]">
                This does not complete a P2P trade.
              </strong>{' '}
              It only moves USDC into your wallet. To trade with someone, use{' '}
              <Link href="/market" className="text-[var(--accent)] hover:underline">
                Market
              </Link>{' '}
              or{' '}
              <Link href="/orders" className="text-[var(--accent)] hover:underline">
                Orders
              </Link>
              .
            </div>

            {!isAuthenticated || !verified ? (
              <p className="text-sm text-amber-700 dark:text-amber-300">
                Sign in with Pollar to swap.
              </p>
            ) : null}

            <button
              type="button"
              disabled={!canSwap || busy}
              onClick={() => void runSwap()}
              className="btn-primary w-full sm:w-auto min-h-11 px-8"
            >
              {busy ? 'Working…' : 'Swap XLM for USDC'}
            </button>

            {status ? (
              <p className="text-sm text-[var(--foreground-secondary)]" role="status" aria-live="polite">
                {status}
              </p>
            ) : null}
          </div>
        )}
      </div>
    </section>
  );
}
