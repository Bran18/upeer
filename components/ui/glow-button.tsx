'use client';

import { NavLink } from '@/components/transition/nav-link';
import type { ComponentProps } from 'react';

type GlowButtonProps = {
  href: string;
  children: React.ReactNode;
  variant?: 'primary' | 'secondary' | 'ghost';
  direction?: 'forward' | 'back';
  className?: string;
};

export function GlowButton({
  href,
  children,
  variant = 'primary',
  direction = 'forward',
  className = '',
}: GlowButtonProps) {
  const base =
    'inline-flex min-h-[44px] items-center justify-center px-6 text-[0.75rem] font-medium uppercase tracking-[0.16em] transition-[background-color,transform] duration-200 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent)] active:scale-[0.98]';
  const styles =
    variant === 'primary'
      ? 'bg-[var(--accent)] text-[var(--accent-ink)] hover:bg-[var(--accent-hover)]'
      : variant === 'secondary'
        ? 'border border-[var(--line)] bg-transparent text-[var(--foreground)] hover:bg-[var(--fill)]'
        : 'text-[var(--foreground-secondary)] hover:text-[var(--foreground)]';

  return (
    <NavLink href={href} direction={direction} className={`${base} ${styles} ${className}`}>
      {children}
    </NavLink>
  );
}

type GlowButtonNativeProps = ComponentProps<'button'> & {
  variant?: 'primary' | 'secondary' | 'ghost';
};

export function GlowButtonNative({
  children,
  variant = 'primary',
  className = '',
  type = 'button',
  ...props
}: GlowButtonNativeProps) {
  const base =
    'inline-flex min-h-[44px] items-center justify-center px-6 text-[0.75rem] font-medium uppercase tracking-[0.16em] transition-[background-color,opacity] duration-200 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent)] disabled:cursor-not-allowed disabled:opacity-40';
  const styles =
    variant === 'primary'
      ? 'bg-[var(--accent)] text-[var(--accent-ink)] hover:bg-[var(--accent-hover)]'
      : variant === 'secondary'
        ? 'border border-[var(--line)] bg-transparent text-[var(--foreground)]'
        : 'text-[var(--foreground-secondary)]';

  return (
    <button type={type} className={`${base} ${styles} ${className}`} {...props}>
      {children}
    </button>
  );
}
