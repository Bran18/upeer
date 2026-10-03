import Image from 'next/image';
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
  src?: string | null;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
};

const SIZE = {
  sm: 'h-8 w-8 text-[0.6875rem]',
  md: 'h-9 w-9 text-xs',
  lg: 'h-11 w-11 text-sm',
  xl: 'h-16 w-16 text-base',
};

const PIXEL = {
  sm: 32,
  md: 36,
  lg: 44,
  xl: 64,
};

export function Avatar({ label, src, size = 'md', className }: AvatarProps) {
  const trimmedSrc = src?.trim();
  if (trimmedSrc) {
    return (
      <Image
        src={trimmedSrc}
        alt=""
        aria-hidden="true"
        width={PIXEL[size]}
        height={PIXEL[size]}
        unoptimized
        className={cn(
          'inline-flex shrink-0 rounded-full object-cover',
          SIZE[size],
          className,
        )}
      />
    );
  }

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
