'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/cn';

type NavPillLinkProps = {
  href: string;
  label: string;
  overlay?: boolean;
};

export function NavPillLink({ href, label, overlay = false }: NavPillLinkProps) {
  const pathname = usePathname();
  const active = pathname === href || pathname.startsWith(`${href}/`);

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
