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
      <section className="panel-card">
        <h2 className="text-headline">Reflector Pulse (FX)</h2>
        <p className="mt-2 text-xs text-subtle">
          Reference prices for LATAM fiat. Executable quotes apply merchant spread
          on top.
          {reflector?.feedHint === 'dex_or_cex' ? (
            <span className="mt-2 block text-amber-700 dark:text-amber-300">
              This oracle is not the FX feed—LATAM symbols may be empty. For
              COP/MXN, set{' '}
              <code className="font-mono text-[10px]" translate="no">
                REFLECTOR_PULSE_CONTRACT_ID
              </code>{' '}
              to the testnet FX oracle (
              CCSSOHTBL3LEWUCBBEB5NJFC2OKFRC74OWEIJIZLRJBGAAU4VMU5NV4W).
            </span>
          ) : null}
        </p>
        {error ? (
          <p className="mt-3 text-sm text-red-600 dark:text-red-300" role="alert">
            {error}
          </p>
        ) : null}
        {reflector ? (
          <ul className="mt-4 space-y-2 text-sm">
            {reflector.quotes.map((quote) => (
              <li
                key={quote.symbol}
                className="flex flex-col gap-1 border-b border-[var(--line)] py-2 sm:flex-row sm:justify-between"
              >
                <span className="font-medium" translate="no">{quote.symbol}</span>
                <span className="font-mono tabular-nums break-all sm:text-right">
                  {quote.price}
                  {quote.stale ? (
                    <span className="ml-2 text-amber-600 dark:text-amber-400">
                      stale
                    </span>
                  ) : null}
                </span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="mt-3 text-sm text-subtle">Loading…</p>
        )}
      </section>

      <section className="panel-card">
        <h2 className="text-headline">Trustless Work V1</h2>
        <p className="mt-2 text-xs text-subtle">
          Single-release escrow API (server-side keys only).
        </p>
        {tw ? (
          <dl className="mt-4 space-y-2 text-sm">
            <div className="flex justify-between gap-4">
              <dt className="text-muted">API key</dt>
              <dd className="font-mono" translate="no">{tw.apiKeyStatus}</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-muted">Base URL</dt>
              <dd className="min-w-0 truncate font-mono text-xs" translate="no">
                {tw.baseUrl}
              </dd>
            </div>
            {tw.message ? (
              <p className="text-muted">{tw.message}</p>
            ) : null}
          </dl>
        ) : (
          <p className="mt-3 text-sm text-subtle">Loading…</p>
        )}
      </section>
    </div>
  );
}
