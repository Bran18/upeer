import type { Metadata, Viewport } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import '@pollar/react/styles.css';
import { AppProviders } from '@/components/providers/app-providers';
import { SiteShell } from '@/components/site-shell';
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
  title: 'UPEER — USDC OTC on Stellar',
  description:
    'Verified merchants, Reflector quotes, Trustless Work escrow. Trade USDC peer to peer on Stellar.',
};

export const viewport: Viewport = {
  themeColor: '#070b14',
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
      style={{ colorScheme: 'dark' }}
    >
      <body className="flex min-h-[100dvh] flex-col bg-[var(--background)] text-[var(--foreground)]">
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
