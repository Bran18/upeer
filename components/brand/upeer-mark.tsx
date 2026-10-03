import { cn } from '@/lib/cn';
import { useId } from 'react';

type UpeerMarkProps = {
  className?: string;
  title?: string;
};

export function UpeerMark({ className, title = 'upeer' }: UpeerMarkProps) {
  const uid = useId().replace(/:/g, '');
  const mint = `upeerMint-${uid}`;
  const ice = `upeerIce-${uid}`;
  return (
    <svg
      viewBox="0 0 48 48"
      className={cn('shrink-0', className)}
      role="img"
      aria-label={title}
    >
      <title>{title}</title>
      <defs>
        <linearGradient id={mint} x1="8" y1="40" x2="28" y2="6" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#14c4a8" />
          <stop offset="100%" stopColor="#7ef0d8" />
        </linearGradient>
        <linearGradient id={ice} x1="40" y1="8" x2="18" y2="42" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#f4fdff" />
          <stop offset="100%" stopColor="#9adff0" />
        </linearGradient>
      </defs>
      <path
        d="M14.2 31.6c-4.1-4.4-3.8-11.2.8-15.2 4.5-4 11.2-3.8 15.3.5"
        fill="none"
        stroke={`url(#${mint})`}
        strokeWidth="7.2"
        strokeLinecap="round"
      />
      <path
        d="M33.8 16.4c4.1 4.4 3.8 11.2-.8 15.2-4.5 4-11.2 3.8-15.3-.5"
        fill="none"
        stroke={`url(#${ice})`}
        strokeWidth="7.2"
        strokeLinecap="round"
      />
    </svg>
  );
}
