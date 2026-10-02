'use client';

import { usePollar } from '@pollar/react';
import { useState } from 'react';
import { PollarRequired } from '@/components/pollar-required';
import {
  exchangePollarSessionFromClient,
  readStoredSession,
  upeerAuthedFetch,
} from '@/lib/upeer-api';

export function MerchantApplyForm() {
  return (
    <PollarRequired>
      <MerchantApplyFormInner />
    </PollarRequired>
  );
}

function MerchantApplyFormInner() {
  const { isAuthenticated, verified, getClient } = usePollar();
  const [displayName, setDisplayName] = useState('');
  const [status, setStatus] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const submit = async () => {
    setBusy(true);
    setStatus(null);
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
        body: JSON.stringify({ displayName }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error ?? 'Apply failed');
      }
      setStatus(`Application submitted (${data.status}).`);
    } catch (error) {
      setStatus(error instanceof Error ? error.message : 'Apply failed');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="rounded-xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
      <label className="block text-sm">
        Display name
        <input
          className="mt-1 w-full rounded-lg border border-zinc-300 px-3 py-2 dark:border-zinc-700 dark:bg-zinc-950"
          value={displayName}
          onChange={(e) => setDisplayName(e.target.value)}
          placeholder="Your desk name"
        />
      </label>
      <button
        type="button"
        disabled={!isAuthenticated || !verified || busy || displayName.length < 2}
        onClick={() => void submit()}
        className="mt-4 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
      >
        Submit application
      </button>
      {status ? (
        <p className="mt-3 text-sm text-zinc-600 dark:text-zinc-400">{status}</p>
      ) : null}
    </div>
  );
}
