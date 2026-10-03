import type { MeProfile } from '@/lib/profile/types';

type SessionStatus = 'anonymous' | 'syncing' | 'ready' | 'error';

export function shortenWallet(address: string): string {
  if (address.length < 12) {
    return address;
  }
  return `${address.slice(0, 4)}…${address.slice(-4)}`;
}

export type UserIdentity = {
  /** Primary label in header menu trigger */
  primaryLabel: string;
  /** Secondary line under name (wallet), when shown */
  walletLine: string | null;
  /** Label passed to Avatar initials */
  avatarLabel: string;
  /** True when profile is loaded but no display name is set */
  promptDisplayName: boolean;
  loading: boolean;
};

export function resolveUserIdentity(input: {
  profile: MeProfile | null | undefined;
  sessionStatus: SessionStatus | undefined;
  walletAddress: string | null | undefined;
}): UserIdentity {
  const { profile, sessionStatus, walletAddress } = input;
  const stellar = profile?.stellarAddress?.trim() || walletAddress?.trim() || null;
  const displayName = profile?.displayName?.trim() || null;

  const loading =
    sessionStatus === 'syncing' ||
    (sessionStatus === 'ready' && !profile && Boolean(walletAddress));

  if (loading) {
    return {
      primaryLabel: 'Account',
      walletLine: stellar ? shortenWallet(stellar) : null,
      avatarLabel: displayName ?? stellar ?? 'Account',
      promptDisplayName: false,
      loading: true,
    };
  }

  if (displayName) {
    return {
      primaryLabel: displayName,
      walletLine: stellar ? shortenWallet(stellar) : null,
      avatarLabel: displayName,
      promptDisplayName: false,
      loading: false,
    };
  }

  if (profile) {
    return {
      primaryLabel: 'Add your name',
      walletLine: stellar ? shortenWallet(stellar) : null,
      avatarLabel: stellar ?? 'Member',
      promptDisplayName: true,
      loading: false,
    };
  }

  if (stellar) {
    return {
      primaryLabel: 'Account',
      walletLine: shortenWallet(stellar),
      avatarLabel: stellar,
      promptDisplayName: false,
      loading: false,
    };
  }

  return {
    primaryLabel: 'Account',
    walletLine: null,
    avatarLabel: 'Account',
    promptDisplayName: false,
    loading: false,
  };
}

/** @deprecated Use resolveUserIdentity */
export function menuTriggerLabel(
  displayName: string | null | undefined,
  walletAddress: string | null | undefined,
): string {
  if (displayName?.trim()) {
    return displayName.trim();
  }
  if (walletAddress) {
    return shortenWallet(walletAddress);
  }
  return 'Account';
}
