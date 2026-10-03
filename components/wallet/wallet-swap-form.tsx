'use client';

import Link from 'next/link';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { SwapProvider, SwapQuote, SwapVenue } from '@pollar/core';
import { usePollar } from '@pollar/react';
import { WalletAssetIcon } from '@/components/wallet/wallet-asset-icon';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/toaster';
import {
  assetRefId,
  assetRefLabel,
  NATIVE_XLM,
  swapTokenToAssetRef,
  type SwapAssetRef,
} from '@/lib/pollar/swap-assets';

type SellOption = {
  id: string;
  label: string;
  shortLabel?: string;
  available: string | null;
  asset: SwapAssetRef;
};

type BuyOption = {
  id: string;
  label: string;
  shortLabel?: string;
  asset: SwapAssetRef;
};

type Props = {
  sellOptions: SellOption[];
  balanceAssetIds: Set<string>;
  onSwapped: () => void;
  layout?: 'default' | 'dashboard';
};

const ROUTE_LABELS: Record<SwapProvider, string> = {
  auto: 'Auto',
  aquarius: 'Aquarius',
  soroswap: 'Soroswap',
  sdex: 'Stellar DEX',
};

function formatVenue(venue: SwapVenue): string {
  return ROUTE_LABELS[venue] ?? venue;
}

function assetCode(label: string | undefined, asset: SwapAssetRef): string {
  if (label) {
    return label;
  }
  return assetRefLabel(asset);
}

export function WalletSwapForm({
  sellOptions,
  balanceAssetIds,
  onSwapped,
  layout = 'default',
}: Props) {
  const {
    verified,
    wallet,
    getSwapConfig,
    getSwapTokens,
    getSwapQuote,
    swap,
    getClient,
  } = usePollar();
  const toast = useToast();

  const [venues, setVenues] = useState<SwapVenue[] | null>(null);
  const [configLoading, setConfigLoading] = useState(true);
  const [buyOptions, setBuyOptions] = useState<BuyOption[]>([]);
  const [buyLoading, setBuyLoading] = useState(true);

  const [sellId, setSellId] = useState('');
  const [buyId, setBuyId] = useState('');
  const [amount, setAmount] = useState('');
  const [provider, setProvider] = useState<SwapProvider>('auto');

  const [quote, setQuote] = useState<SwapQuote | null>(null);
  const [quoteLoading, setQuoteLoading] = useState(false);
  const [quoteError, setQuoteError] = useState<string | null>(null);

  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const quoteSeq = useRef(0);

  const selectableSell = useMemo(
    () => sellOptions.filter((b) => b.available != null && Number(b.available) > 0),
    [sellOptions],
  );

  const selectedSell =
    selectableSell.find((b) => b.id === sellId) ?? selectableSell[0] ?? null;
  const selectedBuy =
    buyOptions.find((b) => b.id === buyId) ?? buyOptions[0] ?? null;

  const routes = useMemo(
    () => (venues && venues.length > 0 ? (['auto', ...venues] as SwapProvider[]) : []),
    [venues],
  );

  useEffect(() => {
    let cancelled = false;
    setConfigLoading(true);
    void getSwapConfig()
      .then((list) => {
        if (!cancelled) {
          setVenues(list);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setVenues([]);
        }
      })
      .finally(() => {
        if (!cancelled) {
          setConfigLoading(false);
        }
      });
    return () => {
      cancelled = true;
    };
  }, [getSwapConfig]);

  useEffect(() => {
    if (!venues || venues.length === 0) {
      setBuyOptions([]);
      setBuyLoading(false);
      return;
    }
    let cancelled = false;
    setBuyLoading(true);
    void getSwapTokens()
      .then((tokens) => {
        if (cancelled) {
          return;
        }
        const fromTokens: BuyOption[] = tokens.map((t) => {
          const asset = swapTokenToAssetRef(t);
          const name = t.name ? `${t.code} (${t.name})` : t.code;
          return {
            id: assetRefId(asset),
            label: name,
            shortLabel: t.code,
            asset,
          };
        });
        const seen = new Set(fromTokens.map((o) => o.id));
        const options: BuyOption[] = [];
        if (!seen.has('native')) {
          options.push({
            id: 'native',
            label: 'XLM (native)',
            shortLabel: 'XLM',
            asset: NATIVE_XLM,
          });
        }
        options.push(...fromTokens);
        setBuyOptions(options);
        setBuyId((current) => {
          if (current && options.some((o) => o.id === current)) {
            return current;
          }
          const usdc = options.find(
            (o) => o.asset.type !== 'native' && o.asset.code === 'USDC',
          );
          if (usdc) {
            return usdc.id;
          }
          return options[0]?.id ?? '';
        });
      })
      .catch(() => {
        if (!cancelled) {
          setBuyOptions([
            { id: 'native', label: 'XLM (native)', shortLabel: 'XLM', asset: NATIVE_XLM },
          ]);
        }
      })
      .finally(() => {
        if (!cancelled) {
          setBuyLoading(false);
        }
      });
    return () => {
      cancelled = true;
    };
  }, [getSwapTokens, venues]);

  useEffect(() => {
    if (selectableSell[0] && !sellId) {
      const xlm = selectableSell.find((s) => s.id === 'native');
      setSellId(xlm?.id ?? selectableSell[0].id);
    }
  }, [selectableSell, sellId]);

  const fetchQuote = useCallback(async () => {
    const amt = amount.trim();
    if (!selectedSell || !selectedBuy || !amt || Number(amt) <= 0) {
      setQuote(null);
      setQuoteError(null);
      return;
    }
    if (assetRefId(selectedSell.asset) === assetRefId(selectedBuy.asset)) {
      setQuote(null);
      setQuoteError('Choose different sell and buy assets.');
      return;
    }

    const seq = ++quoteSeq.current;
    setQuoteLoading(true);
    setQuoteError(null);
    try {
      const quotes = await getSwapQuote({
        sellAsset: selectedSell.asset,
        buyAsset: selectedBuy.asset,
        amount: amt,
        provider,
      });
      if (seq !== quoteSeq.current) {
        return;
      }
      if (quotes.length === 0) {
        setQuote(null);
        setQuoteError('No route for this pair. Try another amount or asset.');
        return;
      }
      setQuote(quotes[0]);
    } catch (e) {
      if (seq !== quoteSeq.current) {
        return;
      }
      const message = e instanceof Error ? e.message : 'Could not get a quote.';
      if (message === 'SDK_SWAP_NO_ROUTE') {
        setQuote(null);
        setQuoteError('No route for this pair. Try another amount or asset.');
      } else {
        setQuote(null);
        setQuoteError(message);
      }
    } finally {
      if (seq === quoteSeq.current) {
        setQuoteLoading(false);
      }
    }
  }, [amount, getSwapQuote, provider, selectedBuy, selectedSell]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void fetchQuote();
    }, 400);
    return () => window.clearTimeout(timer);
  }, [fetchQuote]);

  const buyNeedsTrustline =
    selectedBuy != null &&
    selectedBuy.asset.type !== 'native' &&
    !balanceAssetIds.has(assetRefId(selectedBuy.asset));

  const flipAssets = () => {
    if (!selectedSell || !selectedBuy) {
      return;
    }
    const prevBuyAssetId = assetRefId(selectedBuy.asset);
    const prevSellAssetId = assetRefId(selectedSell.asset);
    const nextSell = selectableSell.find((s) => assetRefId(s.asset) === prevBuyAssetId);
    const nextBuy = buyOptions.find((b) => assetRefId(b.asset) === prevSellAssetId);
    if (nextSell) {
      setSellId(nextSell.id);
    }
    if (nextBuy) {
      setBuyId(nextBuy.id);
    }
    setQuote(null);
    setQuoteError(null);
  };

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);
    if (!verified) {
      setError('Wallet session is still verifying. Wait a moment and try again.');
      return;
    }
    if (!quote) {
      setError(quoteError ?? 'Wait for a quote or adjust the amount.');
      return;
    }

    setBusy(true);
    try {
      getClient().resetTransactionState();
      const outcome = await swap(quote);
      if (outcome.status === 'success') {
        toast.success('Swap complete', `Transaction ${outcome.hash.slice(0, 8)}…`);
        setAmount('');
        setQuote(null);
        onSwapped();
        return;
      }
      const message =
        outcome.status === 'error' && 'message' in outcome && typeof outcome.message === 'string'
          ? outcome.message
          : outcome.status === 'error' && 'details' in outcome && typeof outcome.details === 'string'
            ? outcome.details
            : 'Swap did not complete.';
      setError(message);
      toast.error('Swap failed', message);
    } catch (e) {
      const message = e instanceof Error ? e.message : 'Swap failed';
      setError(message);
      toast.error('Swap failed', message);
    } finally {
      setBusy(false);
    }
  }

  const setMaxAmount = () => {
    if (selectedSell?.available != null) {
      setAmount(selectedSell.available);
    }
  };

  if (wallet?.custody === 'smart') {
    return (
      <p className="text-sm text-[var(--foreground-secondary)] text-pretty">
        Swaps are not available for passkey (smart) wallets yet. Use a custodial or
        external Stellar wallet to swap assets.
      </p>
    );
  }

  if (configLoading) {
    return (
      <p className="text-sm text-[var(--foreground-secondary)]" role="status">
        Checking swap availability…
      </p>
    );
  }

  if (!venues || venues.length === 0) {
    return (
      <p className="text-sm text-[var(--foreground-secondary)] text-pretty">
        Swap is not available for this app. Enable at least one venue in the Pollar
        dashboard under Treasury → Swap.
      </p>
    );
  }

  if (selectableSell.length === 0) {
    return (
      <p className="text-sm text-[var(--foreground-secondary)] text-pretty">
        No spendable balance to swap from. Receive XLM or another asset first, then try
        again.
      </p>
    );
  }

  if (buyLoading || buyOptions.length === 0) {
    return (
      <p className="text-sm text-[var(--foreground-secondary)]" role="status">
        Loading swap tokens…
      </p>
    );
  }

  const submitLabel = buyNeedsTrustline ? 'Create Trustline & Swap' : 'Confirm Swap';
  const sellCode = selectedSell
    ? assetCode(selectedSell.shortLabel, selectedSell.asset)
    : '—';
  const buyCode = selectedBuy ? assetCode(selectedBuy.shortLabel, selectedBuy.asset) : '—';

  const formClass =
    layout === 'dashboard'
      ? 'wallet-form wallet-form--dashboard wallet-swap-form'
      : 'flex flex-col gap-6';

  const quotePanel = (
    <aside className="wallet-ticket" aria-labelledby="wallet-swap-summary-title">
      <h4 id="wallet-swap-summary-title" className="wallet-swap-aside-title">
        Ticket
      </h4>
      <div className="wallet-quote-card wallet-quote-card--prominent" aria-live="polite">
        {quote && !quoteLoading ? (
          <>
            <p className="wallet-quote-kicker">You receive</p>
            <p className="wallet-quote-hero tabular-nums">
              ~{quote.amountOut}
              <span className="wallet-quote-hero-unit">{buyCode}</span>
            </p>
            <div className="wallet-ticket-perforation" aria-hidden="true" />
            <dl className="wallet-quote-grid">
              <div className="wallet-quote-row">
                <dt>Minimum</dt>
                <dd className="tabular-nums">{quote.minReceived}</dd>
              </div>
              {quote.priceImpactPct ? (
                <div className="wallet-quote-row">
                  <dt>Price impact</dt>
                  <dd className="tabular-nums">{quote.priceImpactPct}%</dd>
                </div>
              ) : null}
              <div className="wallet-quote-row">
                <dt>Route</dt>
                <dd>{formatVenue(quote.provider)}</dd>
              </div>
            </dl>
          </>
        ) : quoteError ? (
          <p className="text-sm text-[var(--foreground-secondary)] text-pretty">{quoteError}</p>
        ) : quoteLoading ? (
          <p className="text-sm text-[var(--foreground-secondary)]">Updating quote…</p>
        ) : (
          <p className="text-sm text-[var(--foreground-secondary)] text-pretty">
            Enter an amount to mint a quote ticket.
          </p>
        )}
      </div>

      {error ? (
        <p className="text-sm text-red-800 dark:text-red-200" role="alert">
          {error}
        </p>
      ) : null}

      <Button
        type="submit"
        form="wallet-swap-form"
        disabled={busy || !verified || !quote || quoteLoading}
        aria-busy={busy}
        className="w-full"
      >
        {busy ? 'Swapping…' : submitLabel}
      </Button>

      <p className="text-xs text-[var(--foreground-tertiary)] text-pretty">
        Not a P2P trade. Use the{' '}
        <Link href="/market" className="font-medium text-[var(--accent)] hover:underline">
          market
        </Link>{' '}
        to exchange with a person.
      </p>
    </aside>
  );

  return (
    <form
      id="wallet-swap-form"
      onSubmit={handleSubmit}
      className={formClass}
      noValidate
    >
      {buyNeedsTrustline ? (
        <p className="wallet-callout wallet-callout--warn text-pretty">
          You do not hold {selectedBuy?.label ?? 'this asset'} yet. The swap will create
          a trustline first (about 0.5 XLM reserve unless your app sponsors trustlines).
        </p>
      ) : null}

      <div className={layout === 'dashboard' ? 'wallet-swap-workspace' : undefined}>
        <div className="wallet-swap-editor">
          <div className="wallet-swap-trade-grid">
            <div className="wallet-trade-leg wallet-trade-leg--pay">
              <div className="wallet-trade-leg-head">
                <span className="wallet-leg-kicker">You pay</span>
                {selectedSell?.available != null ? (
                  <button type="button" className="wallet-max-btn" onClick={setMaxAmount}>
                    Max
                  </button>
                ) : null}
              </div>
              <div className="wallet-trade-amount-row">
                <label htmlFor="wallet-swap-amount" className="sr-only">
                  Amount to sell
                </label>
                <input
                  id="wallet-swap-amount"
                  name="amount"
                  type="text"
                  inputMode="decimal"
                  autoComplete="off"
                  spellCheck={false}
                  className="wallet-amount-input tabular-nums"
                  placeholder="0"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                />
                <label htmlFor="wallet-swap-sell" className="sr-only">
                  Sell asset
                </label>
                <div className="wallet-asset-pill">
                  <WalletAssetIcon code={sellCode} className="wallet-asset-icon--sm" />
                  <select
                    id="wallet-swap-sell"
                    name="sellAsset"
                    className="wallet-asset-select"
                    value={selectedSell?.id ?? ''}
                    onChange={(e) => setSellId(e.target.value)}
                  >
                    {selectableSell.map((item) => (
                      <option key={item.id} value={item.id}>
                        {item.shortLabel ?? item.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              {selectedSell?.available != null ? (
                <p className="wallet-trade-hint tabular-nums">
                  {selectedSell.available} {sellCode} available
                </p>
              ) : null}
            </div>

            <div className="wallet-trade-divider">
              <button
                type="button"
                className="wallet-flip-btn"
                onClick={flipAssets}
                aria-label="Flip sell and buy assets"
              >
                <span aria-hidden="true">↕</span>
              </button>
            </div>

            <div className="wallet-trade-leg wallet-trade-leg--receive">
              <div className="wallet-trade-leg-head">
                <span className="wallet-leg-kicker">You receive</span>
              </div>
              <div className="wallet-trade-amount-row">
                <p className="wallet-amount-input wallet-amount-input--preview tabular-nums" aria-live="polite">
                  {quote && !quoteLoading
                    ? `~${quote.amountOut}`
                    : quoteLoading
                      ? '…'
                      : '0'}
                </p>
                <label htmlFor="wallet-swap-buy" className="sr-only">
                  Buy asset
                </label>
                <div className="wallet-asset-pill">
                  <WalletAssetIcon code={buyCode} className="wallet-asset-icon--sm" />
                  <select
                    id="wallet-swap-buy"
                    name="buyAsset"
                    className="wallet-asset-select"
                    value={selectedBuy?.id ?? ''}
                    onChange={(e) => setBuyId(e.target.value)}
                  >
                    {buyOptions.map((item) => (
                      <option key={item.id} value={item.id}>
                        {item.shortLabel ?? item.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <p className="wallet-trade-hint">
                {quoteLoading ? 'Fetching quote…' : 'Estimated after 0.5% slippage'}
              </p>
            </div>
          </div>

          <div className="wallet-route-block">
            <span id="wallet-swap-route-label" className="field-label">Route</span>
            <div
              className="wallet-route-list"
              role="radiogroup"
              aria-labelledby="wallet-swap-route-label"
            >
              {routes.map((route) => (
                <button
                  key={route}
                  type="button"
                  role="radio"
                  aria-checked={provider === route}
                  className={
                    provider === route
                      ? 'wallet-route-pill wallet-route-pill--active'
                      : 'wallet-route-pill'
                  }
                  onClick={() => setProvider(route)}
                >
                  {ROUTE_LABELS[route]}
                </button>
              ))}
            </div>
          </div>
        </div>

        {layout === 'dashboard' ? quotePanel : null}
      </div>

      {layout === 'dashboard' ? null : (
        <>
          <div className="wallet-quote-card" aria-live="polite">
            {quote ? (
              <dl className="wallet-quote-grid">
                <div className="wallet-quote-row">
                  <dt>Minimum received</dt>
                  <dd className="tabular-nums">{quote.minReceived}</dd>
                </div>
                {quote.priceImpactPct ? (
                  <div className="wallet-quote-row">
                    <dt>Price impact</dt>
                    <dd className="tabular-nums">{quote.priceImpactPct}%</dd>
                  </div>
                ) : null}
                <div className="wallet-quote-row">
                  <dt>Route</dt>
                  <dd>{formatVenue(quote.provider)}</dd>
                </div>
              </dl>
            ) : quoteError ? (
              <p className="text-sm text-[var(--foreground-secondary)] text-pretty">
                {quoteError}
              </p>
            ) : quoteLoading ? (
              <p className="text-sm text-[var(--foreground-secondary)]">Updating quote…</p>
            ) : (
              <p className="text-sm text-[var(--foreground-secondary)]">
                Quotes refresh as you type.
              </p>
            )}
          </div>
          <div className="flex flex-col gap-4 border-t border-[var(--line)] pt-6">
            {error ? (
              <p className="text-sm text-red-800 dark:text-red-200" role="alert">
                {error}
              </p>
            ) : null}
            <Button
              type="submit"
              disabled={busy || !verified || !quote || quoteLoading}
              aria-busy={busy}
              className="w-full sm:w-auto"
            >
              {busy ? 'Swapping…' : submitLabel}
            </Button>
          </div>
          <p className="text-xs text-[var(--foreground-tertiary)] text-pretty">
            Swapping is not a P2P trade. To exchange with a person, use the{' '}
            <Link href="/market" className="font-medium text-[var(--accent)] hover:underline">
              market
            </Link>
            .
          </p>
        </>
      )}
    </form>
  );
}
