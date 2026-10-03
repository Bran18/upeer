'use client';

import { usePollar } from '@pollar/react';
import { NavPillLink } from '@/components/nav/nav-pill-link';
import { useOptionalUpeerSession } from '@/components/session/upeer-session-provider';
import { cn } from '@/lib/cn';
import { navLinksForSession } from '@/lib/nav/user-links';

type PrimaryNavProps = {
  overlay?: boolean;
  className?: string;
};

export function PrimaryNav({ overlay = false, className = '' }: PrimaryNavProps) {
  const { isAuthenticated } = usePollar();
  const session = useOptionalUpeerSession();

  const links = navLinksForSession(
    isAuthenticated,
    Boolean(session?.isOnboarded),
    session?.profile?.platformIntent,
  );

  return (
    <nav
      className={cn(
        'site-header-bar flex min-w-0 items-center gap-0.5',
        overlay && 'site-header-bar--overlay',
        className,
      )}
      aria-label="Main"
    >
      {links.map((link) => (
        <NavPillLink
          key={link.href}
          href={link.href}
          label={link.label}
          overlay={overlay}
          match={link.match}
          activeExcept={link.activeExcept}
        />
      ))}
    </nav>
  );
}
