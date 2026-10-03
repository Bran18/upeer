import { cn } from '@/lib/cn';

function initialsFromLabel(label: string): string {
  const parts = label.trim().split(/\s+/).filter(Boolean);
  if (parts.length >= 2) {
    return `${parts[0][0] ?? ''}${parts[1][0] ?? ''}`.toUpperCase();
  }
  if (parts[0]?.length >= 2) {
    return parts[0].slice(0, 2).toUpperCase();
  }
  return parts[0]?.[0]?.toUpperCase() ?? '?';
}

type AvatarProps = {
  label: string;
  size?: 'sm' | 'md';
  className?: string;
};

const SIZE = {
  sm: 'h-8 w-8 text-[0.6875rem]',
  md: 'h-9 w-9 text-xs',
};

export function Avatar({ label, size = 'md', className }: AvatarProps) {
  return (
    <span
      aria-hidden="true"
      className={cn(
        'inline-flex shrink-0 items-center justify-center rounded-full bg-[var(--accent-muted)] font-semibold text-[var(--accent)]',
        SIZE[size],
        className,
      )}
    >
      {initialsFromLabel(label)}
    </span>
  );
}
