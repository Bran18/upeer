'use client';

import Link from 'next/link';
import { CopyWalletButton } from '@/components/dashboard/copy-wallet-button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import type { MeProfile, PlatformIntent } from '@/lib/profile/types';
import { roleLabel } from '@/lib/nav/user-links';

const INTENT_LABEL: Record<PlatformIntent, string> = {
  buyer: 'Buyer',
  merchant: 'Merchant',
  both: 'Buyer & merchant',
};

function merchantBadge(status: MeProfile['merchantStatus']) {
  switch (status) {
    case 'approved':
      return { label: 'Merchant approved', variant: 'success' as const };
    case 'pending':
      return { label: 'Verification pending', variant: 'accent' as const };
    case 'rejected':
      return { label: 'Verification declined', variant: 'muted' as const };
    case 'suspended':
      return { label: 'Desk suspended', variant: 'muted' as const };
    default:
      return null;
  }
}

export function ProfilePanel({ profile }: { profile: MeProfile }) {
  const intent = profile.platformIntent!;
  const merchant = merchantBadge(profile.merchantStatus);
  const role = roleLabel(intent);

  return (
    <Card className="h-fit lg:sticky lg:top-[calc(var(--site-header-height)+1rem)]">
      <CardHeader>
        <CardTitle>Account</CardTitle>
        <CardDescription>Wallet and profile on upeer.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-5 pt-0">
        <div>
          <p className="text-xs font-medium uppercase tracking-[0.14em] text-[var(--foreground-tertiary)]">
            Role
          </p>
          <p className="mt-1 font-medium">{INTENT_LABEL[intent]}</p>
          {role ? (
            <Badge variant="accent" className="mt-2">
              {role}
            </Badge>
          ) : null}
        </div>

        {profile.displayName ? (
          <div>
            <p className="text-xs font-medium uppercase tracking-[0.14em] text-[var(--foreground-tertiary)]">
              Display name
            </p>
            <p className="mt-1 font-medium">{profile.displayName}</p>
          </div>
        ) : null}

        {(intent === 'merchant' || intent === 'both') && merchant ? (
          <div>
            <p className="text-xs font-medium uppercase tracking-[0.14em] text-[var(--foreground-tertiary)]">
              Merchant status
            </p>
            <Badge variant={merchant.variant} className="mt-2">
              {merchant.label}
            </Badge>
          </div>
        ) : null}

        <div>
          <p className="text-xs font-medium uppercase tracking-[0.14em] text-[var(--foreground-tertiary)]">
            Stellar wallet
          </p>
          <p
            className="mt-2 break-all font-mono text-xs leading-relaxed text-[var(--foreground-secondary)]"
            translate="no"
          >
            {profile.stellarAddress}
          </p>
          <div className="mt-3">
            <CopyWalletButton address={profile.stellarAddress} />
          </div>
        </div>

        <div className="border-t border-[var(--line)] pt-4">
          <p className="text-sm text-[var(--foreground-secondary)] text-pretty">
            Need to change your role or public name?
          </p>
          <Link
            href="/settings"
            className="mt-2 inline-flex text-sm font-medium text-[var(--accent)] hover:text-[var(--accent-hover)]"
          >
            Go to settings
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}
