'use client';

import { useEffect, useId, useRef, useState } from 'react';
import { RolePills } from '@/components/dashboard/role-pills';
import { useUpeerSession } from '@/components/session/upeer-session-provider';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/toaster';
import type { PlatformIntent } from '@/lib/profile/types';
import { updateMeProfile } from '@/lib/upeer-api';

export function ProfileSettingsForm() {
  const errorId = useId();
  const displayNameRef = useRef<HTMLInputElement>(null);
  const { profile, refreshProfile, status } = useUpeerSession();

  const [intent, setIntent] = useState<PlatformIntent | null>(null);
  const [displayName, setDisplayName] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const toast = useToast();

  useEffect(() => {
    if (status !== 'ready' || !profile) {
      return;
    }
    setIntent(profile.platformIntent);
    setDisplayName(profile.displayName ?? '');
  }, [status, profile]);

  const needsMerchantName = intent === 'merchant' || intent === 'both';

  async function handleSave(event: React.FormEvent) {
    event.preventDefault();
    if (!intent) {
      setError('Choose how you use UPEER, then save again.');
      toast.error('Choose a role', 'Pick buyer, seller, or both, then save.');
      return;
    }
    if (needsMerchantName && displayName.trim().length < 2) {
      setError('Add a merchant display name (at least 2 characters).');
      displayNameRef.current?.focus();
      toast.error('Display name needed', 'Sellers need a name buyers can recognize.');
      return;
    }

    setBusy(true);
    setError(null);
    try {
      await updateMeProfile({
        platformIntent: intent,
        displayName: needsMerchantName
          ? displayName.trim()
          : displayName.trim() || undefined,
      });
      await refreshProfile();
      toast.success('Profile saved', 'Your marketplace role and name are up to date.');
    } catch (err) {
      const message =
        err instanceof Error
          ? err.message
          : 'Could not save your profile. Try again.';
      setError(message);
      toast.error('Could not save', message);
    } finally {
      setBusy(false);
    }
  }

  if (status !== 'ready' || !profile) {
    return null;
  }

  return (
    <form onSubmit={handleSave} className="space-y-6" noValidate>
      <fieldset className="m-0 border-0 p-0">
        <legend className="field-label">Marketplace role</legend>
        <p className="mt-1 text-sm text-[var(--foreground-secondary)] text-pretty">
          Updates which desks and shortcuts appear in your navigation.
        </p>
        <div className="mt-4">
          <RolePills
            value={intent}
            onChange={(next) => {
              setIntent(next);
              setError(null);
            }}
          />
        </div>
      </fieldset>

      <div>
        <label htmlFor="profile-display-name" className="field-label">
          {needsMerchantName ? 'Merchant display name' : 'Display name'}
        </label>
        <p className="mt-1 text-sm text-[var(--foreground-secondary)] text-pretty">
          {needsMerchantName
            ? 'Shown to buyers on offers and quotes.'
            : 'Optional public label on your profile.'}
        </p>
        <input
          ref={displayNameRef}
          id="profile-display-name"
          name="displayName"
          type="text"
          autoComplete="organization"
          spellCheck={false}
          maxLength={80}
          value={displayName}
          onChange={(e) => {
            setDisplayName(e.target.value);
          }}
          placeholder="e.g. Andes Liquidity…"
          className="field-input"
        />
      </div>

      {error ? (
        <p id={errorId} className="text-sm text-red-800 dark:text-red-200" role="alert">
          {error}
        </p>
      ) : null}

      <Button type="submit" disabled={busy} aria-busy={busy}>
        {busy ? 'Saving…' : 'Save profile'}
      </Button>
    </form>
  );
}
