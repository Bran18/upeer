'use client';

import { useEffect, useState } from 'react';
import { useUpeerSession } from '@/components/session/upeer-session-provider';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/toaster';
import { updateMeProfile } from '@/lib/upeer-api';

const STELLAR_G_REGEX = /^G[ABCDEFGHIJKLMNOPQRSTUVWXYZ234567]{55}$/;

export function PayoutSettingsForm() {
  const { profile, refreshProfile, status } = useUpeerSession();
  const [payoutAddress, setPayoutAddress] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const toast = useToast();

  useEffect(() => {
    if (status !== 'ready' || !profile) {
      return;
    }
    setPayoutAddress(profile.payoutAddress ?? '');
  }, [status, profile]);

  async function handleSave(event: React.FormEvent) {
    event.preventDefault();
    const trimmed = payoutAddress.trim();
    if (!STELLAR_G_REGEX.test(trimmed)) {
      setError('Enter a valid Stellar public key (starts with G, 56 characters).');
      toast.error('Invalid payout address', 'It must start with G and be 56 characters.');
      return;
    }
    setBusy(true);
    setError(null);
    try {
      await updateMeProfile({ payoutAddress: trimmed });
      await refreshProfile();
      toast.success('Payout address saved', 'Escrow can release USDC to this wallet.');
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'Could not save payout address.';
      setError(message);
      toast.error('Could not save', message);
    } finally {
      setBusy(false);
    }
  }

  if (status !== 'ready' || !profile) {
    return null;
  }

  const showSellerCopy =
    profile.platformIntent === 'merchant' || profile.platformIntent === 'both';

  return (
    <form onSubmit={handleSave} className="mx-auto max-w-lg space-y-5" noValidate>
      <p className="text-sm text-[var(--foreground-secondary)] text-pretty">
        {showSellerCopy
          ? 'When you sell USDC, escrow releases to this Stellar address. Buyers see your fiat instructions separately.'
          : 'Optional for buyers. Set this if you also post sell orders or receive USDC payouts.'}
      </p>

      <div>
        <label htmlFor="settings-payout" className="field-label">
          Stellar payout address
        </label>
        <p className="mt-1 text-xs text-[var(--foreground-tertiary)]">
          Must match a wallet you control on the same network as UPEER (testnet).
        </p>
        <input
          id="settings-payout"
          name="payoutAddress"
          type="text"
          spellCheck={false}
          autoComplete="off"
          className="field-input mt-2 font-mono text-sm"
          value={payoutAddress}
          onChange={(e) => {
            setPayoutAddress(e.target.value);
          }}
          placeholder="G…"
        />
      </div>

      {error ? (
        <p className="text-sm text-red-800 dark:text-red-200" role="alert">
          {error}
        </p>
      ) : null}

      <Button type="submit" disabled={busy} aria-busy={busy}>
        {busy ? 'Saving…' : 'Save payout address'}
      </Button>
    </form>
  );
}
