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
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'pass';
  shape?: 'round' | 'tile';
  className?: string;
};

const SIZE = {
  sm: 'h-8 w-8 text-[0.6875rem]',
  md: 'h-9 w-9 text-xs',
  lg: 'h-11 w-11 text-sm',
  xl: 'h-16 w-16 text-base',
  pass: 'h-[5.5rem] w-[5.5rem] text-xl',
};

const PIXEL = {
  sm: 32,
  md: 36,
  lg: 44,
  xl: 64,
  pass: 88,
};

const SHAPE = {
  round: 'rounded-full',
  tile: 'rounded-[1.15rem]',
};

export function Avatar({
  label,
  src,
  size = 'md',
  shape = 'round',
  className,
}: AvatarProps) {
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
          'inline-flex shrink-0 object-cover',
          SHAPE[shape],
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
        'inline-flex shrink-0 items-center justify-center bg-[var(--accent-muted)] font-semibold text-[var(--accent)]',
        SHAPE[shape],
        SIZE[size],
        className,
      )}
    >
      {initialsFromLabel(label)}
    </span>
  );
}
