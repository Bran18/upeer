import type { ReactNode } from 'react';

type AppPageProps = {
  children: ReactNode;
  width?: 'narrow' | 'content' | 'wide';
  className?: string;
};

const WIDTH: Record<NonNullable<AppPageProps['width']>, string> = {
  narrow: 'max-w-[640px]',
  content: 'max-w-[980px]',
  wide: 'max-w-[1120px]',
};

export function AppPage({
  children,
  width = 'content',
  className = '',
}: AppPageProps) {
  return (
    <div
      className={`page-shell ${WIDTH[width]} py-12 sm:py-16 lg:py-20 ${className}`}
    >
      {children}
    </div>
  );
}
