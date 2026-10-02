'use client';

import Link from 'next/link';
import { useOptionalUpeerSession } from '@/components/session/upeer-session-provider';

const INTENT_LABEL = {
  buyer: 'Buyer',
  merchant: 'Merchant',
  both: 'Buyer & merchant',
} as const;

export function ProfileBadge() {
  const session = useOptionalUpeerSession();
  if (!session?.isOnboarded || !session.profile?.platformIntent) {
    return null;
  }

  const label = INTENT_LABEL[session.profile.platformIntent];

  return (
    <Link
      href="/onboarding"
      className="hidden rounded-full bg-[var(--fill)] px-3 py-1 text-xs font-medium text-[var(--foreground-secondary)] sm:inline-block"
      title="Review your marketplace role"
    >
      {label}
    </Link>
  );
}
