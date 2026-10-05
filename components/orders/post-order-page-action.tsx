'use client';

import Link from 'next/link';
import { usePollar } from '@pollar/react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/cn';
import { postOrderNavItem } from '@/lib/nav/site-nav';

type Props = {
  /** When signed out: open Pollar sign-in, or hide the control entirely. */
  guestAction?: 'sign-in' | 'hide';
  label?: string;
  className?: string;
};

export function PostOrderPageAction({
  guestAction = 'sign-in',
  label = 'Post Order',
  className,
}: Props) {
  const { isAuthenticated, openLoginModal } = usePollar();

  if (!isAuthenticated) {
    if (guestAction === 'hide') {
      return null;
    }
    return (
      <Button
        type="button"
        className={cn('btn-primary shrink-0 self-start sm:self-auto', className)}
        onClick={() => openLoginModal()}
      >
        {label}
      </Button>
    );
  }

  return (
    <Link
      href={postOrderNavItem.href}
      className={cn('btn-primary shrink-0 self-start sm:self-auto', className)}
    >
      {label}
    </Link>
  );
}
