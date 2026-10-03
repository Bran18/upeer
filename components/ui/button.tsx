import { cn } from '@/lib/cn';
import { forwardRef, type ComponentProps } from 'react';

type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger';
type ButtonSize = 'sm' | 'md' | 'lg';

export type ButtonProps = ComponentProps<'button'> & {
  variant?: ButtonVariant;
  size?: ButtonSize;
  fullWidth?: boolean;
};

const VARIANT: Record<ButtonVariant, string> = {
  primary:
    'bg-[var(--accent)] text-[var(--accent-ink)] hover:bg-[var(--accent-hover)] border border-transparent',
  secondary:
    'bg-[var(--surface)] text-[var(--foreground)] border border-[var(--line)] hover:bg-[var(--fill)]',
  ghost:
    'bg-transparent text-[var(--foreground-secondary)] border border-transparent hover:bg-[var(--fill)] hover:text-[var(--foreground)]',
  danger:
    'bg-transparent text-red-600 border border-transparent hover:bg-red-500/10 dark:text-red-300',
};

const SIZE: Record<ButtonSize, string> = {
  sm: 'min-h-9 px-3 text-xs',
  md: 'min-h-11 px-4 text-sm',
  lg: 'min-h-12 px-5 text-sm',
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  function Button(
    {
      variant = 'primary',
      size = 'md',
      fullWidth = false,
      className,
      type = 'button',
      ...props
    },
    ref,
  ) {
    return (
      <button
        ref={ref}
        type={type}
        className={cn(
          'inline-flex items-center justify-center gap-2 rounded-[var(--radius-ui)] font-medium transition-[background-color,border-color,color,opacity] duration-200 touch-manipulation',
          'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent)]',
          'disabled:cursor-not-allowed disabled:opacity-45',
          VARIANT[variant],
          SIZE[size],
          fullWidth && 'w-full',
          className,
        )}
        {...props}
      />
    );
  },
);
