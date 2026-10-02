import { NavLink } from '@/components/transition/nav-link';
import type { ComponentProps } from 'react';

type GlowButtonProps = {
  href: string;
  children: React.ReactNode;
  variant?: 'primary' | 'ghost';
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
    'group relative inline-flex items-center justify-center overflow-hidden rounded-full px-6 py-3 text-sm font-semibold tracking-wide transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent)]';
  const styles =
    variant === 'primary'
      ? 'bg-[var(--accent)] text-[var(--accent-ink)] shadow-[0_0_40px_-8px_var(--accent-glow)] hover:brightness-110'
      : 'border border-[var(--line)] bg-[var(--surface)]/60 text-[var(--foreground)] backdrop-blur-sm hover:border-[var(--accent)]/50 hover:bg-[var(--surface)]';

  return (
    <NavLink href={href} direction={direction} className={`${base} ${styles} ${className}`}>
      <span className="relative z-10">{children}</span>
      {variant === 'primary' ? (
        <span
          className="pointer-events-none absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/25 to-transparent transition group-hover:translate-x-full duration-700"
          aria-hidden
        />
      ) : null}
    </NavLink>
  );
}

type GlowButtonNativeProps = ComponentProps<'button'> & {
  variant?: 'primary' | 'ghost';
};

export function GlowButtonNative({
  children,
  variant = 'primary',
  className = '',
  ...props
}: GlowButtonNativeProps) {
  const base =
    'inline-flex items-center justify-center rounded-full px-6 py-3 text-sm font-semibold tracking-wide transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent)] disabled:cursor-not-allowed disabled:opacity-50';
  const styles =
    variant === 'primary'
      ? 'bg-[var(--accent)] text-[var(--accent-ink)] shadow-[0_0_40px_-8px_var(--accent-glow)] hover:brightness-110'
      : 'border border-[var(--line)] bg-[var(--surface)]/60 backdrop-blur-sm hover:border-[var(--accent)]/50';

  return (
    <button type="button" className={`${base} ${styles} ${className}`} {...props}>
      {children}
    </button>
  );
}
