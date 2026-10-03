'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { SwapProvider, SwapQuote, SwapVenue } from '@pollar/core';
import { usePollar } from '@pollar/react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/toaster';
import {
  assetRefId,
  assetRefLabel,
  balanceRowToAssetRef,
  NATIVE_XLM,
  swapTokenToAssetRef,
  type SwapAssetRef,
} from '@/lib/pollar/swap-assets';
type SellOption = {
  id: string;
  label: string;
  available: string | null;
  asset: SwapAssetRef;
};

type BuyOption = {
  id: string;
  label: string;
  asset: SwapAssetRef;
};

type Props = {
  sellOptions: SellOption[];
  balanceAssetIds: Set<string>;
  onSwapped: () => void;
};

const ROUTE_LABELS: Record<SwapProvider, string> = {
  auto: 'Auto (best price)',
  aquarius: 'Aquarius',
  soroswap: 'Soroswap',
  sdex: 'Stellar DEX',
};

function formatVenue(venue: SwapVenue): string {
  return ROUTE_LABELS[venue] ?? venue;
}

export function WalletSwapForm({
  sellOptions,
  balanceAssetIds,
  onSwapped,
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
            asset,
          };
        });
        const seen = new Set(fromTokens.map((o) => o.id));
        const options: BuyOption[] = [];
        if (!seen.has('native')) {
          options.push({
            id: 'native',
            label: 'XLM (native)',
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
          setBuyOptions([{ id: 'native', label: 'XLM (native)', asset: NATIVE_XLM }]);
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
        setQuoteError('No route for this pair right now. Try another pair or amount.');
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
        setQuoteError('No route for this pair right now. Try another pair or amount.');
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

  const submitLabel = buyNeedsTrustline ? 'Create trustline & swap' : 'Swap';

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-6" noValidate>
      {buyNeedsTrustline ? (
        <p className="text-xs leading-relaxed text-amber-800 dark:text-amber-200 text-pretty">
          You do not hold {selectedBuy?.label ?? 'this asset'} yet. The swap will create
          a trustline first (about 0.5 XLM reserve unless your app sponsors trustlines).
        </p>
      ) : null}

      <div className="grid gap-6 sm:grid-cols-2 sm:gap-4">
        <div className="min-w-0">
          <label htmlFor="wallet-swap-sell" className="field-label">Sell</label>
          <select
            id="wallet-swap-sell"
            name="sellAsset"
            className="field-input mt-2 max-w-full truncate"
            value={selectedSell?.id ?? ''}
            onChange={(e) => setSellId(e.target.value)}
          >
            {selectableSell.map((item) => (
              <option key={item.id} value={item.id}>
                {item.label}
              </option>
            ))}
          </select>
          {selectedSell?.available != null ? (
            <p className="mt-2 text-xs tabular-nums text-[var(--foreground-secondary)]">
              {selectedSell.available} available
            </p>
          ) : null}
        </div>
        <div className="min-w-0">
          <div className="flex items-center justify-between gap-2">
            <label htmlFor="wallet-swap-buy" className="field-label">Buy</label>
            <button
              type="button"
              className="text-xs font-medium text-[var(--accent)] hover:underline"
              onClick={flipAssets}
              aria-label="Flip sell and buy assets"
            >
              Flip
            </button>
          </div>
          <select
            id="wallet-swap-buy"
            name="buyAsset"
            className="field-input mt-2 max-w-full truncate"
            value={selectedBuy?.id ?? ''}
            onChange={(e) => setBuyId(e.target.value)}
          >
            {buyOptions.map((item) => (
              <option key={item.id} value={item.id}>
                {item.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div>
        <label htmlFor="wallet-swap-amount" className="field-label">
          Amount to sell
        </label>
        <input
          id="wallet-swap-amount"
          name="amount"
          type="text"
          inputMode="decimal"
          autoComplete="off"
          spellCheck={false}
          className="field-input tabular-nums mt-2"
          placeholder="0.00"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
        />
        <p className="mt-2 text-xs text-[var(--foreground-tertiary)]">
          Amount of {selectedSell ? assetRefLabel(selectedSell.asset) : 'sell asset'}.
        </p>
      </div>

      <div>
        <span className="field-label block">Route</span>
        <div className="mt-2 flex flex-wrap gap-2">
          {routes.map((route) => (
            <button
              key={route}
              type="button"
              className={
                provider === route
                  ? 'nav-pill nav-pill--active min-h-9 px-3'
                  : 'nav-pill min-h-9 px-3 text-[var(--foreground-secondary)]'
              }
              onClick={() => setProvider(route)}
            >
              {ROUTE_LABELS[route]}
            </button>
          ))}
        </div>
      </div>

      <div
        className="rounded-[var(--radius-ui)] border border-[var(--line)] bg-[var(--fill)] px-4 py-3 text-sm"
        aria-live="polite"
      >
        {quoteLoading ? (
          <p className="text-[var(--foreground-secondary)]">Fetching quote…</p>
        ) : quote ? (
          <dl className="space-y-1.5">
            <div className="flex justify-between gap-3">
              <dt className="text-[var(--foreground-secondary)]">You receive</dt>
              <dd className="tabular-nums font-medium">
                ~{quote.amountOut} {assetRefLabel(selectedBuy!.asset)}
              </dd>
            </div>
            <div className="flex justify-between gap-3">
              <dt className="text-[var(--foreground-secondary)]">Minimum</dt>
              <dd className="tabular-nums">{quote.minReceived}</dd>
            </div>
            {quote.priceImpactPct ? (
              <div className="flex justify-between gap-3">
                <dt className="text-[var(--foreground-secondary)]">Price impact</dt>
                <dd className="tabular-nums">{quote.priceImpactPct}%</dd>
              </div>
            ) : null}
            <div className="flex justify-between gap-3">
              <dt className="text-[var(--foreground-secondary)]">Venue</dt>
              <dd>{formatVenue(quote.provider)}</dd>
            </div>
          </dl>
        ) : quoteError ? (
          <p className="text-[var(--foreground-secondary)]">{quoteError}</p>
        ) : (
          <p className="text-[var(--foreground-secondary)]">
            Enter an amount to see a live quote.
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
        <a href="/market" className="font-medium text-[var(--accent)] hover:underline">
          market
        </a>
        .
      </p>
    </form>
  );
}
