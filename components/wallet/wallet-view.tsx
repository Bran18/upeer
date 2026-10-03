'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { usePollar } from '@pollar/react';
import { CopyWalletButton } from '@/components/dashboard/copy-wallet-button';
import { WalletSendForm } from '@/components/wallet/wallet-send-form';
import { WalletSwapForm } from '@/components/wallet/wallet-swap-form';
import { PollarRequired } from '@/components/pollar-required';
import { useUpeerSession } from '@/components/session/upeer-session-provider';
import { Button } from '@/components/ui/button';
import { getStellarNetworkClient } from '@/lib/config/network-client';
import { shortenWallet } from '@/lib/nav/user-identity';
import {
  assetRefId,
  balanceRowToAssetRef,
} from '@/lib/pollar/swap-assets';

const sectionClass =
  'space-y-4 rounded-[var(--radius-ui)] border border-[var(--line)] bg-[var(--surface)] p-4 sm:p-5';

type WalletAction = 'send' | 'swap';

function balanceId(record: {
  type?: string;
  code: string;
  issuer?: string;
}): string {
  return assetRefId(balanceRowToAssetRef(record));
}

function balanceLabel(record: {
  type?: string;
  code: string;
  issuer?: string;
}): string {
  if (record.type === 'native') {
    return 'XLM (native)';
  }
  if (record.issuer) {
    return `${record.code} · ${shortenWallet(record.issuer)}`;
  }
  return record.code;
}

function hashToAction(hash: string): WalletAction | null {
  if (hash === 'swap' || hash === 'fund') {
    return 'swap';
  }
  return null;
}

function WalletViewInner() {
  const network = getStellarNetworkClient();
  const { profile } = useUpeerSession();
  const {
    isAuthenticated,
    verified,
    wallet,
    walletBalance,
    refreshWalletBalance,
    openReceiveModal,
    openTxHistoryModal,
    openLoginModal,
    tx,
  } = usePollar();

  const [action, setAction] = useState<WalletAction>('send');

  useEffect(() => {
    const syncFromHash = () => {
      const next = hashToAction(window.location.hash.replace(/^#/, ''));
      if (next) {
        setAction(next);
      }
    };
    syncFromHash();
    window.addEventListener('hashchange', syncFromHash);
    return () => window.removeEventListener('hashchange', syncFromHash);
  }, []);

  useEffect(() => {
    if (isAuthenticated && verified) {
      void refreshWalletBalance();
    }
  }, [isAuthenticated, verified, refreshWalletBalance]);

  useEffect(() => {
    if (tx.step === 'success') {
      void refreshWalletBalance();
    }
  }, [tx.step, refreshWalletBalance]);

  const address = profile?.stellarAddress ?? wallet?.address ?? null;

  const stellarBalances = useMemo(() => {
    if (walletBalance.step !== 'loaded') {
      return [];
    }
    return walletBalance.data.balances.filter(
      (b) => !b.chain || b.chain === 'STELLAR',
    );
  }, [walletBalance]);

  const sendOptions = useMemo(
    () =>
      stellarBalances.map((b) => ({
        id: balanceId(b),
        label: balanceLabel(b),
        available: b.available,
        asset: balanceRowToAssetRef(b),
      })),
    [stellarBalances],
  );

  const swapSellOptions = useMemo(
    () =>
      stellarBalances.map((b) => ({
        id: balanceId(b),
        label: balanceLabel(b),
        available: b.available,
        asset: balanceRowToAssetRef(b),
      })),
    [stellarBalances],
  );

  const balanceAssetIds = useMemo(
    () => new Set(stellarBalances.map((b) => balanceId(b))),
    [stellarBalances],
  );

  const selectAction = (next: WalletAction) => {
    setAction(next);
    const hash = next === 'swap' ? '#swap' : '';
    const base = `${window.location.pathname}${window.location.search}`;
    window.history.replaceState(null, '', hash ? `${base}${hash}` : base);
  };

  if (!isAuthenticated) {
    return (
      <div className={sectionClass}>
        <p className="text-sm text-[var(--foreground-secondary)]">
          Sign in with Pollar to view balances, send payments, and swap assets.
        </p>
        <Button type="button" onClick={() => openLoginModal()}>
          Sign in
        </Button>
      </div>
    );
  }

  return (
    <div className="flex max-w-xl flex-col gap-8">
      <section className={sectionClass}>
        <div>
          <h2 className="text-sm font-semibold text-[var(--foreground)]">
            Your wallet
          </h2>
          <p className="mt-1 text-xs text-[var(--foreground-secondary)] text-pretty">
            {network === 'testnet' ? 'Stellar testnet' : 'Stellar mainnet'} ·
            send payments or swap assets in one place.
          </p>
        </div>
        {address ? (
          <div className="flex flex-wrap items-center gap-2">
            <code
              className="min-w-0 flex-1 truncate rounded-[var(--radius-ui)] bg-[var(--fill)] px-3 py-2 font-mono text-xs"
              translate="no"
            >
              {address}
            </code>
            <CopyWalletButton address={address} />
          </div>
        ) : null}
        <div className="flex flex-wrap gap-2">
          <Button type="button" variant="secondary" size="sm" onClick={() => openReceiveModal()}>
            Receive
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => void refreshWalletBalance()}
          >
            Refresh balances
          </Button>
          <Button type="button" variant="ghost" size="sm" onClick={() => openTxHistoryModal()}>
            Transaction history
          </Button>
        </div>
      </section>

      <section className={sectionClass}>
        <h2 className="text-sm font-semibold text-[var(--foreground)]">Balances</h2>
        {walletBalance.step === 'loading' ? (
          <p className="text-sm text-[var(--foreground-secondary)]" role="status">
            Loading balances…
          </p>
        ) : null}
        {walletBalance.step === 'error' ? (
          <p className="text-sm text-red-800 dark:text-red-200" role="alert">
            {walletBalance.message}
          </p>
        ) : null}
        {walletBalance.step === 'loaded' ? (
          <ul className="divide-y divide-[var(--line)] rounded-[var(--radius-ui)] border border-[var(--line)]">
            {stellarBalances.length === 0 ? (
              <li className="px-4 py-3 text-sm text-[var(--foreground-secondary)]">
                No assets yet.
              </li>
            ) : (
              stellarBalances.map((row) => (
                <li
                  key={balanceId(row)}
                  className="flex items-center justify-between gap-3 px-4 py-3 text-sm"
                >
                  <span className="font-medium">{balanceLabel(row)}</span>
                  <span className="tabular-nums text-[var(--foreground-secondary)]">
                    {row.balance ?? '—'}
                    {row.available != null && row.available !== row.balance
                      ? ` (${row.available} available)`
                      : ''}
                  </span>
                </li>
              ))
            )}
          </ul>
        ) : null}
      </section>

      <section
        id="fund"
        className={`${sectionClass} scroll-mt-[calc(var(--site-header-height)+1rem)]`}
      >
        <div>
          <h2 className="text-sm font-semibold text-[var(--foreground)]">
            Send & swap
          </h2>
          <p className="mt-1 text-xs leading-relaxed text-[var(--foreground-secondary)] text-pretty">
            {action === 'send'
              ? 'Send Stellar assets to any account. Add a memo when the recipient requires one.'
              : 'Swap between assets in your wallet. Quotes refresh as you type; slippage is 0.5%.'}
          </p>
        </div>

        <div
          className="flex flex-wrap gap-2"
          role="tablist"
          aria-label="Wallet actions"
        >
          {(
            [
              ['send', 'Send'],
              ['swap', 'Swap'],
            ] as const
          ).map(([id, label]) => (
            <button
              key={id}
              type="button"
              role="tab"
              aria-selected={action === id}
              id={id === 'swap' ? 'swap' : undefined}
              className={
                action === id
                  ? 'nav-pill nav-pill--active min-h-9 px-3'
                  : 'nav-pill min-h-9 px-3 text-[var(--foreground-secondary)]'
              }
              onClick={() => selectAction(id)}
            >
              {label}
            </button>
          ))}
        </div>

        {action === 'send' ? (
          <WalletSendForm
            balances={sendOptions}
            onSent={() => void refreshWalletBalance()}
          />
        ) : (
          <WalletSwapForm
            sellOptions={swapSellOptions}
            balanceAssetIds={balanceAssetIds}
            onSwapped={() => void refreshWalletBalance()}
          />
        )}
      </section>

      <p className="text-sm text-[var(--foreground-tertiary)]">
        <Link href="/settings?tab=profile" className="font-medium text-[var(--accent)] hover:underline">
          Profile settings
        </Link>
        {' · '}
        <Link href="/dashboard" className="font-medium text-[var(--accent)] hover:underline">
          Dashboard
        </Link>
      </p>
    </div>
  );
}

export function WalletView() {
  return (
    <PollarRequired>
      <WalletViewInner />
    </PollarRequired>
  );
}
