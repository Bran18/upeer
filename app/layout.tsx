import type { Metadata } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import { AppProviders } from '@/components/providers/app-providers';
import { SiteHeader } from '@/components/site-header';
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
  title: 'UPEER',
  description:
    'USDC OTC marketplace on Stellar — verified merchants, Reflector quotes, Trustless Work escrow.',
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
    >
      <body className="min-h-full flex flex-col bg-zinc-50 text-zinc-900 dark:bg-zinc-950 dark:text-zinc-50">
        <AppProviders>
          <SiteHeader />
          <main id="main-content" className="flex-1">{children}</main>
          <footer className="border-t border-zinc-200 py-8 text-center text-xs text-zinc-500 dark:border-zinc-800">
            Testnet only. Fiat declarations do not confirm payment.
          </footer>
        </AppProviders>
      </body>
    </html>
  );
}
