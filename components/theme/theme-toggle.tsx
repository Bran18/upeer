'use client';

import { cn } from '@/lib/cn';
import { toggleTheme } from '@/lib/theme';

type Props = {
  overlay?: boolean;
};

export function ThemeToggle({ overlay = false }: Props) {
  return (
    <button
      type="button"
      aria-label="Switch light and dark theme"
      className={cn(
        'theme-toggle inline-flex h-9 w-9 items-center justify-center rounded-full border text-sm',
        overlay
          ? 'border-white/20 text-white'
          : 'border-[var(--line)] text-[var(--foreground-secondary)] hover:border-[var(--foreground-tertiary)] hover:text-[var(--foreground)]',
        'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent)]',
      )}
      onClick={() => toggleTheme()}
    >
      <svg
        className="theme-toggle-icon theme-toggle-icon--sun h-4 w-4"
        viewBox="0 0 24 24"
        fill="none"
        aria-hidden="true"
      >
        <circle cx="12" cy="12" r="4" stroke="currentColor" strokeWidth="1.6" />
        <path
          d="M12 3.5v1.8M12 18.7v1.8M4.9 4.9l1.3 1.3M17.8 17.8l1.3 1.3M3.5 12h1.8M18.7 12h1.8M4.9 19.1l1.3-1.3M17.8 6.2l1.3-1.3"
          stroke="currentColor"
          strokeWidth="1.6"
          strokeLinecap="round"
        />
      </svg>
      <svg
        className="theme-toggle-icon theme-toggle-icon--moon h-4 w-4"
        viewBox="0 0 24 24"
        fill="none"
        aria-hidden="true"
      >
        <path
          d="M16.4 13.6A6.4 6.4 0 0 1 10.6 5.2 6.6 6.6 0 1 0 18.8 14a6.3 6.3 0 0 1-2.4-.4Z"
          stroke="currentColor"
          strokeWidth="1.6"
          strokeLinejoin="round"
        />
      </svg>
    </button>
  );
}
