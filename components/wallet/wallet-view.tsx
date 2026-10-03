'use client';

import { useEffect, useMemo } from 'react';
import Link from 'next/link';
import { usePollar } from '@pollar/react';
import { CopyWalletButton } from '@/components/dashboard/copy-wallet-button';
import { WalletSendForm } from '@/components/wallet/wallet-send-form';
import { PollarRequired } from '@/components/pollar-required';
import { useUpeerSession } from '@/components/session/upeer-session-provider';
import { Button } from '@/components/ui/button';
import { getStellarNetworkClient } from '@/lib/config/network-client';
import { shortenWallet } from '@/lib/nav/user-identity';

const sectionClass =
  'space-y-4 rounded-[var(--radius-ui)] border border-[var(--line)] bg-[var(--surface)] p-4 sm:p-5';

function balanceId(record: {
  type?: string;
  code: string;
  issuer?: string;
}): string {
  if (record.type === 'native' || record.code === 'XLM') {
    return 'native';
  }
  return `${record.code}:${record.issuer ?? ''}`;
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
  } = usePollar();

  useEffect(() => {
    if (isAuthenticated && verified) {
      void refreshWalletBalance();
    }
  }, [isAuthenticated, verified, refreshWalletBalance]);

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
        asset:
          b.type === 'native'
            ? { type: 'native' as const }
            : {
                type:
                  (b.type === 'credit_alphanum12'
                    ? 'credit_alphanum12'
                    : 'credit_alphanum4') as 'credit_alphanum4' | 'credit_alphanum12',
                code: b.code,
                issuer: b.issuer ?? '',
              },
      })),
    [stellarBalances],
  );

  if (!isAuthenticated) {
    return (
      <div className={sectionClass}>
        <p className="text-sm text-[var(--foreground-secondary)]">
          Sign in with Pollar to view balances and send payments.
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
            classic payments with optional memo (SEP-style deposits).
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

      <section className={sectionClass}>
        <div>
          <h2 className="text-sm font-semibold text-[var(--foreground)]">Send</h2>
          <p className="mt-1 text-xs leading-relaxed text-[var(--foreground-secondary)] text-pretty">
            Send Stellar assets to any account. Add a memo when the recipient requires
            one (exchanges, anchors, or shared deposit addresses).
          </p>
        </div>
        <WalletSendForm
          balances={sendOptions}
          onSent={() => void refreshWalletBalance()}
        />
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
