'use client';

import { useEffect, useState } from 'react';

type ReflectorResponse = {
  quotes: Array<{
    symbol: string;
    price: string;
    stale: boolean;
    ageSeconds: number;
  }>;
  baseAsset: string;
  contractId: string;
  feedHint?: string;
  quotedAssets?: string[];
};

type TwProbe = {
  apiKeyStatus: string;
  message?: string;
  baseUrl: string;
};

export function IntegrationsPanel() {
  const [reflector, setReflector] = useState<ReflectorResponse | null>(null);
  const [tw, setTw] = useState<TwProbe | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    void Promise.all([
      fetch('/api/prices/reference').then((r) => r.json()),
      fetch('/api/escrow/probe').then((r) => r.json()),
    ])
      .then(([prices, probe]) => {
        setReflector(prices as ReflectorResponse);
        setTw(probe as TwProbe);
      })
      .catch((e: unknown) => {
        setError(e instanceof Error ? e.message : 'Failed to load integrations');
      });
  }, []);

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <section className="glass-panel p-5">
        <h2 className="font-semibold">Reflector Pulse (FX)</h2>
        <p className="mt-1 text-xs text-zinc-500">
          Reference prices for LATAM fiat. Executable quotes apply merchant spread
          on top.
          {reflector?.feedHint === 'dex_or_cex' ? (
            <span className="mt-1 block text-amber-700 dark:text-amber-300">
              This oracle is not the FX feed — LATAM symbols may be empty. For
              COP/MXN, set{' '}
              <code className="font-mono text-[10px]">
                REFLECTOR_PULSE_CONTRACT_ID
              </code>{' '}
              to the testnet FX oracle (
              CCSSOHTBL3LEWUCBBEB5NJFC2OKFRC74OWEIJIZLRJBGAAU4VMU5NV4W).
            </span>
          ) : null}
        </p>
        {error ? (
          <p className="mt-3 text-sm text-red-600">{error}</p>
        ) : null}
        {reflector ? (
          <ul className="mt-4 space-y-2 text-sm">
            {reflector.quotes.map((quote) => (
              <li
                key={quote.symbol}
                className="flex justify-between border-b border-zinc-100 py-2 dark:border-zinc-800"
              >
                <span className="font-medium">{quote.symbol}</span>
                <span className="font-mono">
                  {quote.price}
                  {quote.stale ? (
                    <span className="ml-2 text-amber-600">stale</span>
                  ) : null}
                </span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="mt-3 text-sm text-zinc-500">Loading…</p>
        )}
      </section>

      <section className="glass-panel p-5">
        <h2 className="font-semibold">Trustless Work V1</h2>
        <p className="mt-1 text-xs text-zinc-500">
          Single-release escrow API (server-side keys only).
        </p>
        {tw ? (
          <dl className="mt-4 space-y-2 text-sm">
            <div className="flex justify-between">
              <dt>API key</dt>
              <dd className="font-mono">{tw.apiKeyStatus}</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt>Base URL</dt>
              <dd className="truncate font-mono text-xs">{tw.baseUrl}</dd>
            </div>
            {tw.message ? (
              <p className="text-zinc-600 dark:text-zinc-400">{tw.message}</p>
            ) : null}
          </dl>
        ) : (
          <p className="mt-3 text-sm text-zinc-500">Loading…</p>
        )}
      </section>
    </div>
  );
}
