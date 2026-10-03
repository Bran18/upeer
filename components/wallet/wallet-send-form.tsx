'use client';

import { useMemo, useState } from 'react';
import { usePollar } from '@pollar/react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/toaster';
import {
  buildPaymentMemoOptions,
  isStellarPaymentDestination,
  type PaymentMemoKind,
} from '@/lib/stellar/payment-memo';

type BalanceOption = {
  id: string;
  label: string;
  asset:
    | { type: 'native' }
    | { type: 'credit_alphanum4' | 'credit_alphanum12'; code: string; issuer: string };
  available: string | null;
};

type Props = {
  balances: BalanceOption[];
  onSent: () => void;
};

export function WalletSendForm({ balances, onSent }: Props) {
  const { sendPayment, verified } = usePollar();
  const toast = useToast();

  const [destination, setDestination] = useState('');
  const [amount, setAmount] = useState('');
  const [assetId, setAssetId] = useState('');
  const [memoKind, setMemoKind] = useState<PaymentMemoKind>('none');
  const [memoValue, setMemoValue] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const selectable = useMemo(
    () => balances.filter((b) => b.available != null && Number(b.available) > 0),
    [balances],
  );

  const selectedAsset =
    selectable.find((b) => b.id === assetId) ?? selectable[0] ?? null;

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);

    const dest = destination.trim();
    if (!isStellarPaymentDestination(dest)) {
      setError('Enter a valid Stellar address (G… or muxed M…).');
      return;
    }
    const amt = amount.trim();
    if (!amt || !Number.isFinite(Number(amt)) || Number(amt) <= 0) {
      setError('Enter a positive amount.');
      return;
    }
    if (!selectedAsset) {
      setError('Choose an asset with available balance.');
      return;
    }
    if (!verified) {
      setError('Wallet session is still verifying. Wait a moment and try again.');
      return;
    }

    let memoOptions: ReturnType<typeof buildPaymentMemoOptions>;
    try {
      memoOptions = buildPaymentMemoOptions({ kind: memoKind, value: memoValue });
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Invalid memo');
      return;
    }

    setBusy(true);
    try {
      const outcome = await sendPayment({
        destination: dest,
        amount: amt,
        asset: selectedAsset.asset,
        options: memoOptions,
      });
      if (outcome.status === 'success') {
        toast.success('Payment sent', `Transaction ${outcome.hash.slice(0, 8)}…`);
        setDestination('');
        setAmount('');
        setMemoValue('');
        setMemoKind('none');
        onSent();
        return;
      }
      const message =
        outcome.status === 'error' && 'message' in outcome && typeof outcome.message === 'string'
          ? outcome.message
          : 'Payment did not complete.';
      setError(message);
      toast.error('Send failed', message);
    } catch (e) {
      const message = e instanceof Error ? e.message : 'Send failed';
      setError(message);
      toast.error('Send failed', message);
    } finally {
      setBusy(false);
    }
  }

  if (selectable.length === 0) {
    return (
      <p className="text-sm text-[var(--foreground-secondary)] text-pretty">
        No spendable balance found. Fund your wallet with XLM or USDC in{' '}
        <a href="/wallet#swap" className="font-medium text-[var(--accent)] hover:underline">
          Swap
        </a>
        .
      </p>
    );
  }

  const availableHint =
    selectedAsset?.available != null ? `${selectedAsset.available} available` : null;

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-6" noValidate>
      <div>
        <label htmlFor="wallet-send-dest" className="field-label">
          Destination address
        </label>
        <input
          id="wallet-send-dest"
          name="destination"
          type="text"
          spellCheck={false}
          autoComplete="off"
          translate="no"
          className="field-input mt-2 font-mono text-sm"
          placeholder="G… or M…"
          value={destination}
          onChange={(e) => setDestination(e.target.value)}
        />
      </div>

      <div className="grid gap-6 sm:grid-cols-2 sm:gap-4">
        <div className="min-w-0">
          <label htmlFor="wallet-send-asset" className="field-label">Asset</label>
          <select
            id="wallet-send-asset"
            name="asset"
            className="field-input mt-2 max-w-full truncate"
            value={selectedAsset?.id ?? ''}
            onChange={(e) => setAssetId(e.target.value)}
          >
            {selectable.map((item) => (
              <option key={item.id} value={item.id}>
                {item.label}
              </option>
            ))}
          </select>
          {availableHint ? (
            <p className="mt-2 text-xs tabular-nums text-[var(--foreground-secondary)]">
              {availableHint}
            </p>
          ) : null}
        </div>
        <div className="min-w-0">
          <label htmlFor="wallet-send-amount" className="field-label">Amount</label>
          <input
            id="wallet-send-amount"
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
        </div>
      </div>

      <div
        className="space-y-3"
        role="group"
        aria-labelledby="wallet-send-memo-label"
      >
        <span id="wallet-send-memo-label" className="field-label block">
          Memo (optional)
        </span>
        <div className="flex flex-wrap gap-2">
          {(
            [
              ['none', 'None'],
              ['text', 'Text'],
              ['id', 'ID'],
            ] as const
          ).map(([kind, label]) => (
            <button
              key={kind}
              type="button"
              className={
                memoKind === kind
                  ? 'nav-pill nav-pill--active min-h-9 px-3'
                  : 'nav-pill min-h-9 px-3 text-[var(--foreground-secondary)]'
              }
              onClick={() => setMemoKind(kind)}
            >
              {label}
            </button>
          ))}
        </div>
        {memoKind !== 'none' ? (
          <div>
            <label className="sr-only" htmlFor="wallet-send-memo">
              Memo {memoKind === 'text' ? 'text' : 'ID'}
            </label>
            <input
              id="wallet-send-memo"
              name="memo"
              type="text"
              spellCheck={false}
              autoComplete="off"
              className="field-input font-mono text-sm"
              placeholder={memoKind === 'text' ? 'Up to 28 bytes' : 'Numeric ID'}
              value={memoValue}
              onChange={(e) => setMemoValue(e.target.value)}
            />
          </div>
        ) : null}
      </div>

      <div className="flex flex-col gap-4 border-t border-[var(--line)] pt-6">
        {error ? (
          <p className="text-sm text-red-800 dark:text-red-200" role="alert">
            {error}
          </p>
        ) : null}

        <Button
          type="submit"
          disabled={busy || !verified}
          aria-busy={busy}
          className="w-full sm:w-auto"
        >
          {busy ? 'Sending…' : 'Send payment'}
        </Button>
      </div>
    </form>
  );
}
