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
      className="hidden rounded-full border border-[var(--line)] bg-white/5 px-3 py-1 text-xs font-medium text-[var(--muted)] hover:border-[var(--accent)]/40 sm:inline-block"
      title="Review your marketplace role"
    >
      {label}
    </Link>
  );
}
