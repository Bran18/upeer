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

const settingsSectionClass =
  'space-y-4 rounded-[var(--radius-ui)] border border-[var(--line)] bg-[var(--surface)] p-4 sm:p-5';

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
      toast.error('Choose a role', 'Pick buyer, seller, or both, then save.');
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
      toast.success('Profile saved', 'Your name and role are updated.');
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
      <section className={settingsSectionClass}>
        <div>
          <h2 className="text-sm font-semibold text-[var(--foreground)]">
            Public identity
          </h2>
          <p className="mt-1 text-xs leading-relaxed text-[var(--foreground-secondary)] text-pretty">
            This is what others see in the header menu and on the market — not your
            wallet address.
          </p>
        </div>
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
          {!profile.displayName?.trim() ? (
            <p className="mt-2 text-xs text-amber-700 dark:text-amber-300">
              You don&apos;t have a name saved yet — add one here, then save.
            </p>
          ) : null}
        </div>
      </section>

      <section className={settingsSectionClass}>
        <div>
          <h2 className="text-sm font-semibold text-[var(--foreground)]">
            Connected wallet
          </h2>
          <p className="mt-1 text-xs leading-relaxed text-[var(--foreground-secondary)] text-pretty">
            Managed by Pollar. Used to sign in and link escrow — not shown as your
            public label when a display name is set.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <code
            className="min-w-0 flex-1 truncate rounded-[var(--radius-ui)] bg-[var(--fill)] px-3 py-2 font-mono text-xs"
            translate="no"
          >
            {profile.stellarAddress}
          </code>
          <CopyWalletButton address={profile.stellarAddress} />
        </div>
      </section>

      {onboarded ? (
        <section className={settingsSectionClass} aria-labelledby="profile-role-heading">
          <div>
            <h2
              id="profile-role-heading"
              className="text-sm font-semibold text-[var(--foreground)]"
            >
              Marketplace role
            </h2>
            <p className="mt-1 text-xs leading-relaxed text-[var(--foreground-secondary)] text-pretty">
              Controls dashboard shortcuts and whether you post sell orders.
            </p>
          </div>
          <RolePills
            value={intent}
            onChange={(next) => {
              setIntent(next);
              setError(null);
            }}
          />
        </section>
      ) : (
        <p className="text-sm text-[var(--foreground-secondary)] text-pretty">
          <a href="/onboarding" className="font-medium text-[var(--accent)] hover:underline">
            Finish onboarding
          </a>{' '}
          to choose buyer or seller role and unlock payout settings.
        </p>
      )}

      <div className="mt-2 flex flex-col gap-4 border-t border-[var(--line)] pt-8">
        {error ? (
          <p id={errorId} className="text-sm text-red-800 dark:text-red-200" role="alert">
            {error}
          </p>
        ) : null}

        <Button type="submit" disabled={busy} aria-busy={busy} className="w-full sm:w-auto">
          {busy ? 'Saving…' : 'Save profile'}
        </Button>
      </div>
    </form>
  );
}
