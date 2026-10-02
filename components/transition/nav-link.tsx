'use client';

import Link from 'next/link';
import type { ComponentProps } from 'react';

type NavLinkProps = ComponentProps<typeof Link> & {
  direction?: 'forward' | 'back' | 'none';
};

export function NavLink({
  direction = 'forward',
  transitionTypes,
  prefetch,
  ...props
}: NavLinkProps) {
  const types =
    transitionTypes ??
    (direction === 'back'
      ? ['nav-back']
      : direction === 'forward'
        ? ['nav-forward']
        : undefined);

  return (
    <Link
      {...props}
      prefetch={prefetch ?? (direction === 'forward' ? true : undefined)}
      transitionTypes={types}
    />
  );
}
