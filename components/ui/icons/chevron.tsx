import { cn } from '@/lib/cn';

export function IconChevronDown({
  className,
  open = false,
}: {
  className?: string;
  open?: boolean;
}) {
  return (
    <svg
      className={cn(
        'h-4 w-4 shrink-0 transition-transform duration-200',
        open && 'rotate-180',
        className,
      )}
      viewBox="0 0 20 20"
      fill="none"
      aria-hidden="true"
    >
      <path
        d="M5 7.5 10 12.5 15 7.5"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function IconMenu({ className }: { className?: string }) {
  return (
    <svg className={cn('h-5 w-5', className)} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M4 7h16M4 12h16M4 17h16"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </svg>
  );
}
