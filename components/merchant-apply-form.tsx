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
    <section className="panel-card" aria-labelledby="merchant-apply-heading">
      <h2 id="merchant-apply-heading" className="text-headline">
        Apply as a Merchant
      </h2>
      <p className="text-body mt-2 text-sm">
        Choose a public desk name buyers will see on offers.
      </p>
      <label className="field-label mt-6" htmlFor="merchant-apply-name">
        Display name
      </label>
      <input
        id="merchant-apply-name"
        name="displayName"
        type="text"
        autoComplete="organization"
        spellCheck={false}
        className="field-input"
        value={displayName}
        onChange={(e) => setDisplayName(e.target.value)}
        placeholder="Your desk name…"
      />
      <button
        type="button"
        disabled={!isAuthenticated || !verified || busy || displayName.length < 2}
        onClick={() => void submit()}
        className="btn-primary mt-5"
      >
        {busy ? 'Submitting…' : 'Submit Application'}
      </button>
      {status ? (
        <p className="mt-3 text-sm text-muted" role="status" aria-live="polite">
          {status}
        </p>
      ) : null}
    </section>
  );
}
