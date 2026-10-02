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
      className="hidden rounded-full border border-zinc-200 bg-zinc-50 px-3 py-1 text-xs font-medium text-zinc-700 hover:border-zinc-300 sm:inline-block dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-200"
      title="Review your marketplace role"
    >
      {label}
    </Link>
  );
}
