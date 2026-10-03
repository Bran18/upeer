'use client';

import { useRef, useState } from 'react';
import { Avatar } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/toaster';
import { AVATAR_MAX_BYTES } from '@/lib/profile/avatar';
import { removeProfileAvatar, uploadProfileAvatar } from '@/lib/upeer-api';
import type { MeProfile } from '@/lib/profile/types';

type Props = {
  profile: MeProfile;
  onUpdated: (profile: MeProfile) => void;
};

export function ProfileAvatarField({ profile, onUpdated }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const toast = useToast();

  const label = profile.displayName?.trim() || profile.stellarAddress;

  async function handleFileChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) {
      return;
    }
    if (file.size > AVATAR_MAX_BYTES) {
      toast.error('Image too large', 'Use a file under 2 MB.');
      return;
    }

    setBusy(true);
    try {
      const next = await uploadProfileAvatar(file);
      onUpdated(next);
      toast.success('Photo updated', 'Your profile image is live in the app.');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Upload failed';
      toast.error('Could not upload', message);
    } finally {
      setBusy(false);
    }
  }

  async function handleRemove() {
    if (!profile.avatarUrl) {
      return;
    }
    setBusy(true);
    try {
      const next = await removeProfileAvatar();
      onUpdated(next);
      toast.success('Photo removed', 'Initials will show instead.');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Remove failed';
      toast.error('Could not remove', message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
      <Avatar label={label} src={profile.avatarUrl} size="xl" />
      <div className="min-w-0 flex-1 space-y-2">
        <p className="text-sm font-medium text-[var(--foreground)]">Profile photo</p>
        <p className="text-xs leading-relaxed text-[var(--foreground-secondary)] text-pretty">
          Shown in the header menu and on your public offers. Square images work best.
          JPEG, PNG, WebP, or GIF up to 2 MB.
        </p>
        <div className="flex flex-wrap gap-2">
          <input
            ref={inputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp,image/gif"
            className="sr-only"
            onChange={(e) => void handleFileChange(e)}
          />
          <Button
            type="button"
            variant="secondary"
            size="sm"
            disabled={busy}
            onClick={() => inputRef.current?.click()}
          >
            {busy ? 'Uploading…' : 'Upload photo'}
          </Button>
          {profile.avatarUrl ? (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              disabled={busy}
              onClick={() => void handleRemove()}
            >
              Remove
            </Button>
          ) : null}
        </div>
      </div>
    </div>
  );
}
