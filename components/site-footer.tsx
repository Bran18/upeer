import Link from 'next/link';
import { SiteLogo } from '@/components/site-logo';
import { NavLink } from '@/components/transition/nav-link';
import { footerLinks } from '@/lib/nav/user-links';

const LINKS = footerLinks();

const POWERED_BY = [
  { name: 'Pollar', href: 'https://www.pollar.xyz/' },
  { name: 'Trustless Work', href: 'https://www.trustlesswork.com/' },
  { name: 'Reflector', href: 'https://reflector.network/' },
  { name: 'Soroswap', href: 'https://soroswap.finance/' },
  { name: 'Stellar', href: 'https://stellar.org/' },
] as const;

const LEGAL = [
  { label: '© 2026 upeer', href: null },
  { label: 'Testnet', href: null },
  { label: 'Terms', href: '/terms' },
  { label: 'Privacy', href: '/privacy' },
] as const;

export function SiteFooter({ landing = false }: { landing?: boolean }) {
  return (
    <footer
      id="site-footer"
      className={`site-footer${landing ? ' site-footer--landing' : ''}`}
    >
      <div className="page-shell site-footer-inner">
        <div className="site-footer-grid">
          <div className="site-footer-brand">
            <Link
              href="/"
              translate="no"
              className="inline-block rounded-[var(--radius-ui)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[var(--accent)]"
              aria-label="upeer home"
            >
              <SiteLogo className="h-auto" markClassName="h-8 w-8" />
            </Link>
            <p className="site-footer-lede">
              Exchange local currency and USDC directly with verified peers.
              Simple, transparent, protected.
            </p>
          </div>

          <nav className="site-footer-col" aria-label="Product">
            <p className="exchange-kicker">Product</p>
            <ul className="site-footer-list">
              {LINKS.map((link) => (
                <li key={link.href}>
                  <NavLink href={link.href} direction="none" className="site-footer-link">
                    {link.label}
                  </NavLink>
                </li>
              ))}
            </ul>
          </nav>

          <div className="site-footer-col">
            <p className="exchange-kicker">Developers</p>
            <p className="site-footer-copy">
              Bring upeer liquidity into your product.
            </p>
            <p className="site-footer-copy site-footer-copy--muted">
              APIs and SDKs for wallets, fintechs and marketplaces are coming soon.
            </p>
            <a className="site-footer-accent" href="mailto:developers@upeer.xyz">
              Join early access →
            </a>
          </div>
        </div>

        <div className="site-footer-powered">
          <p className="exchange-kicker">Powered by Stellar</p>
          <ul className="site-footer-powered-list">
            {POWERED_BY.map((item) => (
              <li key={item.href}>
                <a
                  href={item.href}
                  target="_blank"
                  rel="noreferrer"
                  className="site-footer-chip"
                >
                  {item.name}
                </a>
              </li>
            ))}
          </ul>
        </div>

        <div className="site-footer-legal">
          <ul className="site-footer-legal-list">
            {LEGAL.map((item) => (
              <li key={item.label}>
                {item.href ? (
                  <Link href={item.href} className="site-footer-legal-link">
                    {item.label}
                  </Link>
                ) : (
                  <span>{item.label}</span>
                )}
              </li>
            ))}
          </ul>
          <p className="site-footer-legal-note">
            Fiat payments settle directly between peers.
          </p>
        </div>
      </div>
    </footer>
  );
}
