'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { usePollar } from '@pollar/react';
import { cn } from '@/lib/cn';
import { postOrderNavItem } from '@/lib/nav/site-nav';

type Props = {
  overlay?: boolean;
};

/** Post-order entry on small screens when signed in (main nav pills are in the menu). */
export function PostOrderHeaderLink({ overlay = false }: Props) {
  const { isAuthenticated } = usePollar();
  const pathname = usePathname();

  if (!isAuthenticated) {
    return null;
  }

  const active =
    pathname === postOrderNavItem.href ||
    pathname.startsWith(`${postOrderNavItem.href}/`);

  return (
    <Link
      href={postOrderNavItem.href}
      className={cn(
        'inline-flex min-h-9 shrink-0 items-center rounded-[var(--radius-ui)] px-3 text-xs font-medium transition-[background-color,border-color,color] duration-200 touch-manipulation lg:hidden',
        'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent)]',
        overlay
          ? cn(
              'border border-white/25 bg-white/12 text-white hover:bg-white/18',
              active && 'border-white/40 bg-white/22',
            )
          : cn(
              'border border-transparent bg-[var(--accent)] text-[var(--accent-ink)] hover:bg-[var(--accent-hover)]',
              active && 'ring-2 ring-[color-mix(in_srgb,var(--accent)_45%,transparent)]',
            ),
      )}
    >
      {postOrderNavItem.label}
    </Link>
  );
}
