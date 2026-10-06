import type { Metadata, Viewport } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import '@pollar/react/styles.css';
import { AppProviders } from '@/components/providers/app-providers';
import { SiteShell } from '@/components/site-shell';
import { THEME_BOOTSTRAP } from '@/lib/theme';
import './globals.css';

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

export const metadata: Metadata = {
  title: {
    default: 'upeer — A market of people',
    template: '%s · upeer',
  },
  description:
    'Buy and sell USDC with local currency through verified merchants. Transparent quotes. Protected transfers.',
};

export const viewport: Viewport = {
  themeColor: '#0c0f0e',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full`}
      suppressHydrationWarning
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: THEME_BOOTSTRAP }} />
      </head>
      <body
        className="flex min-h-[100dvh] flex-col bg-[var(--background)] text-[var(--foreground)]"
        suppressHydrationWarning
      >
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-[max(1rem,env(safe-area-inset-top))] focus:z-[100] focus:rounded-xl focus:bg-[var(--surface)] focus:px-3 focus:py-2 focus:text-sm focus:font-medium focus:shadow focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent)]"
        >
          Skip to content
        </a>
        <AppProviders>
          <div className="page-noise pointer-events-none fixed inset-0 z-[1]" aria-hidden />
          <SiteShell>{children}</SiteShell>
        </AppProviders>
      </body>
    </html>
  );
}
