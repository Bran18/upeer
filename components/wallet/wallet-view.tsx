'use client';

import dynamic from 'next/dynamic';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { usePollar } from '@pollar/react';
import { CopyWalletButton } from '@/components/dashboard/copy-wallet-button';
import { WalletSendForm } from '@/components/wallet/wallet-send-form';
import { WalletAssetIcon } from '@/components/wallet/wallet-asset-icon';
import { WalletQuickActions } from '@/components/wallet/wallet-quick-actions';
import { PollarRequired } from '@/components/pollar-required';
import { useUpeerSession } from '@/components/session/upeer-session-provider';
import { Button } from '@/components/ui/button';
import { getStellarNetworkClient } from '@/lib/config/network-client';
import { shortenWallet } from '@/lib/nav/user-identity';
import {
  balanceId,
  formatBalanceAmount,
  pickPrimaryBalance,
  toBalanceOptions,
  type StellarBalanceRow,
} from '@/lib/wallet/balance-display';

const WalletSwapForm = dynamic(
  () =>
    import('@/components/wallet/wallet-swap-form').then((m) => ({
      default: m.WalletSwapForm,
    })),
  {
    loading: () => (
      <p className="text-sm text-[var(--foreground-secondary)]" role="status">
        Loading swap…
      </p>
    ),
  },
);

type WalletAction = 'send' | 'swap';

function hashToAction(hash: string): WalletAction | null {
  if (hash === 'swap' || hash === 'fund') {
    return 'swap';
  }
  if (hash === 'send') {
    return 'send';
  }
  return null;
}

function WalletViewInner() {
  const network = getStellarNetworkClient();
  const { profile } = useUpeerSession();
  const stageRef = useRef<HTMLElement | null>(null);
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

  const syncFromHash = useCallback(() => {
    const next = hashToAction(window.location.hash.replace(/^#/, ''));
    if (next) {
      setAction(next);
    }
  }, []);

  useEffect(() => {
    syncFromHash();
    window.addEventListener('hashchange', syncFromHash);
    return () => window.removeEventListener('hashchange', syncFromHash);
  }, [syncFromHash]);

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

  const stellarBalances = useMemo((): StellarBalanceRow[] => {
    if (walletBalance.step !== 'loaded') {
      return [];
    }
    return walletBalance.data.balances.filter(
      (b) => !b.chain || b.chain === 'STELLAR',
    );
  }, [walletBalance]);

  const balanceOptions = useMemo(
    () => toBalanceOptions(stellarBalances),
    [stellarBalances],
  );

  const primaryBalance = useMemo(
    () => pickPrimaryBalance(stellarBalances),
    [stellarBalances],
  );

  const balanceAssetIds = useMemo(
    () => new Set(stellarBalances.map((b) => balanceId(b))),
    [stellarBalances],
  );

  const selectAction = useCallback((next: WalletAction, scroll = false) => {
    setAction(next);
    const hash = next === 'swap' ? '#swap' : next === 'send' ? '#send' : '';
    const base = `${window.location.pathname}${window.location.search}`;
    window.history.replaceState(null, '', hash ? `${base}${hash}` : base);
    if (scroll) {
      stageRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, []);

  const focusSend = useCallback(() => selectAction('send', true), [selectAction]);
  const focusSwap = useCallback(() => selectAction('swap', true), [selectAction]);

  if (!isAuthenticated) {
    return (
      <div className="wallet-vault wallet-vault--locked">
        <div className="wallet-vault-aura" aria-hidden="true" />
        <p className="wallet-vault-kicker">Stellar vault</p>
        <h2 className="wallet-vault-title text-balance">Sign in to open your vault</h2>
        <p className="wallet-vault-lede text-pretty">
          Balances, deposits, payments, and swaps—secured with Pollar.
        </p>
        <Button type="button" className="mt-6" onClick={() => openLoginModal()}>
          Sign in with Pollar
        </Button>
      </div>
    );
  }

  const networkLabel = network === 'testnet' ? 'Testnet' : 'Mainnet';
  const quickActive =
    action === 'send' ? 'send' : action === 'swap' ? 'swap' : null;

  return (
    <div className="wallet-dashboard">
      <section className="wallet-vault" aria-labelledby="wallet-hero-title">
        <div className="wallet-vault-aura" aria-hidden="true" />
        <div className="wallet-vault-rings" aria-hidden="true">
          <span />
          <span />
          <span />
        </div>

        <div className="wallet-vault-core">
          <div className="wallet-vault-eyebrow">
            <p className="wallet-vault-kicker">{networkLabel} vault</p>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => void refreshWalletBalance()}
              aria-label="Refresh balances"
            >
              Refresh
            </Button>
          </div>

          <h2 id="wallet-hero-title" className="wallet-vault-balance text-balance">
            {walletBalance.step === 'loading' ? (
              'Loading…'
            ) : primaryBalance ? (
              <>
                <span className="tabular-nums">
                  {formatBalanceAmount(primaryBalance.balance)}
                </span>
                <span className="wallet-vault-unit">{primaryBalance.shortLabel}</span>
              </>
            ) : (
              'Empty vault'
            )}
          </h2>

          {primaryBalance?.available != null &&
          primaryBalance.available !== primaryBalance.balance ? (
            <p className="wallet-vault-meta tabular-nums">
              {formatBalanceAmount(primaryBalance.available)} available
            </p>
          ) : (
            <p className="wallet-vault-meta">Ready to send, receive, or swap</p>
          )}

          {address ? (
            <div className="wallet-vault-chip">
              <code className="wallet-address" translate="no" title={address}>
                {shortenWallet(address)}
              </code>
              <CopyWalletButton address={address} />
            </div>
          ) : null}
        </div>

        <WalletQuickActions
          active={quickActive}
          onReceive={() => openReceiveModal()}
          onSend={focusSend}
          onSwap={focusSwap}
          onHistory={() => openTxHistoryModal()}
        />
      </section>

      <div className="wallet-workspace">
        <aside className="wallet-rail" aria-labelledby="wallet-assets-title">
          <div className="wallet-rail-header">
            <h3 id="wallet-assets-title" className="wallet-panel-title">Holdings</h3>
            <p className="wallet-panel-desc">On-chain balances</p>
          </div>

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
            <ul className="wallet-balance-list">
              {stellarBalances.length === 0 ? (
                <li className="wallet-balance-empty">
                  Receive XLM or USDC to seed this vault.
                </li>
              ) : (
                stellarBalances.map((row) => {
                  const option = balanceOptions.find((o) => o.id === balanceId(row));
                  const code = option?.shortLabel ?? row.code;
                  return (
                    <li key={balanceId(row)} className="wallet-coin">
                      <WalletAssetIcon code={code} />
                      <div className="min-w-0 flex-1">
                        <p className="wallet-balance-code">{code}</p>
                        <p className="wallet-balance-meta truncate">
                          {option?.label ?? code}
                        </p>
                      </div>
                      <p className="wallet-balance-amount tabular-nums">
                        {formatBalanceAmount(row.balance)}
                      </p>
                    </li>
                  );
                })
              )}
            </ul>
          ) : null}
        </aside>

        <section
          ref={stageRef}
          id="fund"
          className="wallet-stage scroll-mt-[calc(var(--site-header-height)+1.25rem)]"
          aria-labelledby="wallet-actions-title"
        >
          <div className="wallet-stage-header">
            <div className="min-w-0">
              <h3 id="wallet-actions-title" className="wallet-panel-title">
                {action === 'send' ? 'Send' : 'Swap'}
              </h3>
              <p className="wallet-panel-desc">
                {action === 'send'
                  ? 'Move value to any Stellar address'
                  : 'Live quotes across enabled venues'}
              </p>
            </div>
            <div
              className="wallet-segment wallet-segment--inline"
              role="tablist"
              aria-label="Send or swap"
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
                  id={`wallet-tab-${id}`}
                  aria-selected={action === id}
                  aria-controls={`wallet-tabpanel-${id}`}
                  className={
                    action === id
                      ? 'wallet-segment-btn wallet-segment-btn--active'
                      : 'wallet-segment-btn'
                  }
                  onClick={() => selectAction(id)}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          <div className="wallet-stage-body">
            <div
              id="wallet-tabpanel-send"
              role="tabpanel"
              aria-labelledby="wallet-tab-send"
              hidden={action !== 'send'}
              className="wallet-tabpanel"
            >
              {action === 'send' ? (
                <WalletSendForm
                  layout="dashboard"
                  balances={balanceOptions}
                  onSent={() => void refreshWalletBalance()}
                />
              ) : null}
            </div>
            <div
              id="wallet-tabpanel-swap"
              role="tabpanel"
              aria-labelledby="wallet-tab-swap"
              hidden={action !== 'swap'}
              className="wallet-tabpanel"
            >
              {action === 'swap' ? (
                <WalletSwapForm
                  layout="dashboard"
                  sellOptions={balanceOptions}
                  balanceAssetIds={balanceAssetIds}
                  onSwapped={() => void refreshWalletBalance()}
                />
              ) : null}
            </div>
          </div>
        </section>
      </div>

      <p className="wallet-footer-links text-sm text-[var(--foreground-tertiary)]">
        <Link
          href="/settings?tab=profile"
          className="font-medium text-[var(--accent)] hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent)]"
        >
          Profile settings
        </Link>
        <span aria-hidden="true"> · </span>
        <Link
          href="/dashboard"
          className="font-medium text-[var(--accent)] hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent)]"
        >
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
