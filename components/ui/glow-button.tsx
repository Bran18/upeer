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
    'inline-flex min-h-[44px] items-center justify-center rounded-full px-6 text-[0.9375rem] font-medium transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent)]';
  const styles =
    variant === 'primary'
      ? 'bg-[var(--accent)] text-[var(--accent-ink)] hover:bg-[var(--accent-hover)]'
      : variant === 'secondary'
        ? 'bg-[var(--fill)] text-[var(--accent)] hover:bg-[var(--accent-muted)]'
        : 'text-[var(--accent)] hover:underline';

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
  ...props
}: GlowButtonNativeProps) {
  const base =
    'inline-flex min-h-[44px] items-center justify-center rounded-full px-6 text-[0.9375rem] font-medium transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent)] disabled:cursor-not-allowed disabled:opacity-40';
  const styles =
    variant === 'primary'
      ? 'bg-[var(--accent)] text-[var(--accent-ink)] hover:bg-[var(--accent-hover)]'
      : variant === 'secondary'
        ? 'bg-[var(--fill)] text-[var(--accent)]'
        : 'text-[var(--accent)]';

  return (
    <button type="button" className={`${base} ${styles} ${className}`} {...props}>
      {children}
    </button>
  );
}
