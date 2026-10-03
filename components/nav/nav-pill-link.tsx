'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/cn';
import { isNavItemActive } from '@/lib/nav/active-route';

type NavPillLinkProps = {
  href: string;
  label: string;
  overlay?: boolean;
  match?: string[];
  activeExcept?: string[];
};

export function NavPillLink({
  href,
  label,
  overlay = false,
  match,
  activeExcept,
}: NavPillLinkProps) {
  const pathname = usePathname();
  const active = isNavItemActive(pathname, { href, label, match, activeExcept });

  return (
    <Link
      href={href}
      className={cn(
        'nav-pill focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent)]',
        overlay && 'nav-pill--overlay',
        active && 'nav-pill--active',
        !active && !overlay && 'text-[var(--foreground-secondary)]',
      )}
    >
      {label}
    </Link>
  );
}
