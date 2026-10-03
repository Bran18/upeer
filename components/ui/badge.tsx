import { cn } from '@/lib/cn';

type BadgeVariant = 'default' | 'accent' | 'success' | 'muted';

const VARIANT: Record<BadgeVariant, string> = {
  default: 'bg-[var(--fill)] text-[var(--foreground-secondary)]',
  accent: 'bg-[var(--accent-muted)] text-[var(--accent)]',
  success: 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300',
  muted: 'bg-transparent text-[var(--foreground-tertiary)] ring-1 ring-[var(--line)]',
};

type BadgeProps = {
  children: React.ReactNode;
  variant?: BadgeVariant;
  className?: string;
};

export function Badge({ children, variant = 'default', className }: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-2.5 py-0.5 text-[0.6875rem] font-medium uppercase tracking-[0.12em]',
        VARIANT[variant],
        className,
      )}
    >
      {children}
    </span>
  );
}
