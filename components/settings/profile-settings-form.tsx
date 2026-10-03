'use client';

import { useEffect, useId, useRef, useState } from 'react';
import { RolePills } from '@/components/dashboard/role-pills';
import { CopyWalletButton } from '@/components/dashboard/copy-wallet-button';
import { ProfileAvatarField } from '@/components/settings/profile-avatar-field';
import { useUpeerSession } from '@/components/session/upeer-session-provider';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/toaster';
import { onboardingComplete } from '@/lib/profile/types';
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
  const onboarded = profile ? onboardingComplete(profile) : false;

  async function handleSave(event: React.FormEvent) {
    event.preventDefault();
    const trimmed = displayName.trim();

    if (onboarded && !intent) {
      setError('Choose how you use upeer, then save again.');
      toast.error('Choose a role', 'Pick buy, sell, or both, then save.');
      return;
    }
    if (needsMerchantName && trimmed.length < 2) {
      setError('Add a display name (at least 2 characters).');
      displayNameRef.current?.focus();
      toast.error('Display name needed', 'Sellers need a name buyers can recognize.');
      return;
    }
    if (trimmed.length > 0 && trimmed.length < 2) {
      setError('Display name must be at least 2 characters, or leave it empty.');
      displayNameRef.current?.focus();
      return;
    }

    setBusy(true);
    setError(null);
    try {
      await updateMeProfile({
        ...(onboarded && intent ? { platformIntent: intent } : {}),
        ...(trimmed.length >= 2 ? { displayName: trimmed } : {}),
      });
      await refreshProfile();
      toast.success('Identity saved', 'Your name and role are updated.');
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
    <form onSubmit={handleSave} className="flex max-w-xl flex-col gap-8" noValidate>
      <div className="space-y-5">
        <ProfileAvatarField
          profile={profile}
          onUpdated={() => void refreshProfile()}
        />
        <div>
          <label htmlFor="profile-display-name" className="field-label">
            Display name
          </label>
          <input
            ref={displayNameRef}
            id="profile-display-name"
            name="displayName"
            type="text"
            autoComplete="nickname"
            spellCheck={false}
            maxLength={80}
            required={needsMerchantName}
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            placeholder={needsMerchantName ? 'e.g. Andes Liquidity' : 'e.g. María'}
            className="field-input mt-2"
          />
        </div>
      </div>

      {onboarded ? (
        <div>
          <p id="profile-role-heading" className="exchange-kicker">
            You
          </p>
          <p className="mt-1 text-sm text-[var(--foreground-secondary)] text-pretty">
            Buy local currency for USDC, sell USDC, or both.
          </p>
          <div className="mt-3">
            <RolePills
              value={intent}
              onChange={(next) => {
                setIntent(next);
                setError(null);
              }}
            />
          </div>
        </div>
      ) : (
        <p className="text-sm text-[var(--foreground-secondary)] text-pretty">
          <a href="/onboarding" className="font-medium text-[var(--accent)] hover:underline">
            Finish setup
          </a>{' '}
          to choose buy, sell, or both.
        </p>
      )}

      <div>
        <p className="exchange-kicker">Wallet</p>
        <p className="mt-1 text-sm text-[var(--foreground-secondary)] text-pretty">
          Signs you in. Not used as your public name.
        </p>
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <code
            className="min-w-0 flex-1 truncate rounded-[var(--radius-ui)] bg-[var(--fill)] px-3 py-2 font-mono text-xs"
            translate="no"
          >
            {profile.stellarAddress}
          </code>
          <CopyWalletButton address={profile.stellarAddress} />
        </div>
      </div>

      <div className="space-y-4">
        {error ? (
          <p id={errorId} className="text-sm text-red-800 dark:text-red-200" role="alert">
            {error}
          </p>
        ) : null}
        <Button type="submit" disabled={busy} aria-busy={busy} fullWidth>
          {busy ? 'Saving…' : 'Save'}
        </Button>
      </div>
    </form>
  );
}
