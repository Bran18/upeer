'use client';

import { usePollar } from '@pollar/react';
import { useState } from 'react';
import { useUpeerSession } from '@/components/session/upeer-session-provider';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/toaster';
import {
  exchangePollarSessionFromClient,
  readStoredSession,
  upeerAuthedFetch,
} from '@/lib/upeer-api';

type Props = {
  defaultName?: string;
  onSubmitted?: () => void;
};

export function MerchantApplyForm({ defaultName = '', onSubmitted }: Props) {
  const { isAuthenticated, verified, getClient } = usePollar();
  const { refreshProfile } = useUpeerSession();
  const toast = useToast();
  const [displayName, setDisplayName] = useState(defaultName);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    const name = displayName.trim();
    if (name.length < 2) {
      setError('Use at least 2 characters.');
      return;
    }

    setBusy(true);
    setError(null);
    try {
      let session = readStoredSession();
      if (!session) {
        const auth = getClient().getAuthState();
        if (auth.step !== 'authenticated') {
          throw new Error('Sign in with Pollar first');
        }
        session = await exchangePollarSessionFromClient(getClient());
      }

      const res = await upeerAuthedFetch('/api/merchants/apply', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ displayName: name }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error ?? 'Apply failed');
      }
      await refreshProfile();
      toast.success('Desk listed', 'You can set payout rails and post orders.');
      onSubmitted?.();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Apply failed';
      setError(message);
      toast.error('Could not apply', message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <form
      onSubmit={(event) => void submit(event)}
      className="ui-card space-y-5 p-5 sm:p-6"
      noValidate
      aria-labelledby="merchant-apply-heading"
    >
      <div>
        <h2 id="merchant-apply-heading" className="text-sm font-medium">
          List your desk
        </h2>
        <p className="mt-2 text-sm leading-relaxed text-[var(--foreground-secondary)] text-pretty">
          Choose the public name buyers see on the market. You can post as soon
          as payout and payment methods are set.
        </p>
      </div>
      <div>
        <label className="field-label" htmlFor="merchant-apply-name">
          Desk name
        </label>
        <input
          id="merchant-apply-name"
          name="displayName"
          type="text"
          autoComplete="organization"
          spellCheck={false}
          className="field-input mt-2"
          value={displayName}
          onChange={(event) => setDisplayName(event.target.value)}
          placeholder="The name counterparties will see"
        />
      </div>
      {error ? (
        <p className="text-sm text-red-800 dark:text-red-200" role="alert">
          {error}
        </p>
      ) : null}
      <Button
        type="submit"
        disabled={!isAuthenticated || !verified || busy || displayName.trim().length < 2}
        aria-busy={busy}
      >
        {busy ? 'Listing…' : 'List desk'}
      </Button>
    </form>
  );
}
