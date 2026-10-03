'use client';

import Link from 'next/link';
import { Avatar } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/cn';
import type { UserIdentity } from '@/lib/nav/user-identity';
import { roleLabel } from '@/lib/nav/user-links';
import type { PlatformIntent } from '@/lib/profile/types';

type UserIdentitySummaryProps = {
  identity: UserIdentity;
  platformIntent: PlatformIntent | null | undefined;
  avatarUrl?: string | null;
  walletTitle?: string | null;
  className?: string;
  avatarSize?: 'sm' | 'md' | 'lg';
};

export function UserIdentitySummary({
  identity,
  platformIntent,
  avatarUrl,
  walletTitle,
  className,
  avatarSize = 'md',
}: UserIdentitySummaryProps) {
  const role = roleLabel(platformIntent);
  const onboarded = Boolean(platformIntent);

  return (
    <div className={cn('flex items-start gap-2.5', className)}>
      <Avatar label={identity.avatarLabel} src={avatarUrl} size={avatarSize} />
      <div className="min-w-0 flex-1">
        {identity.promptDisplayName ? (
          <Link
            href="/settings?tab=profile"
            className="truncate text-sm font-semibold text-[var(--accent)] hover:underline"
          >
            {identity.primaryLabel}
          </Link>
        ) : (
          <p className="truncate text-sm font-semibold">{identity.primaryLabel}</p>
        )}
        {identity.walletLine ? (
          <p
            className="mt-0.5 truncate font-mono text-xs text-[var(--foreground-secondary)]"
            translate="no"
            title={walletTitle ?? undefined}
          >
            {identity.walletLine}
          </p>
        ) : null}
        {role ? (
          <Badge variant="accent" className="mt-2">
            {role}
          </Badge>
        ) : (
          <Badge variant="muted" className="mt-2">
            {onboarded ? 'Member' : 'Setup incomplete'}
          </Badge>
        )}
      </div>
    </div>
  );
}
