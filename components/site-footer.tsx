import Link from 'next/link';
import { SiteLogo } from '@/components/site-logo';
import { NavLink } from '@/components/transition/nav-link';
import { footerLinks } from '@/lib/nav/user-links';

const LINKS = footerLinks();

export function SiteFooter({ landing = false }: { landing?: boolean }) {
  const muted = landing
    ? 'text-[var(--foreground-secondary)]'
    : 'text-[var(--foreground-secondary)]';
  const faint = 'text-[var(--foreground-tertiary)]';
  const linkHover = 'hover:text-[var(--foreground)]';

  return (
    <footer
      id="site-footer"
      className="relative z-[2] border-t border-[var(--line)] pb-[max(2.5rem,env(safe-area-inset-bottom))] pt-10 sm:pt-12"
    >
      <div className="page-shell grid gap-10 sm:grid-cols-2 lg:grid-cols-3">
        <div className="sm:col-span-2 lg:col-span-1">
          <Link
            href="/"
            translate="no"
            className="inline-block rounded-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[var(--accent)]"
            aria-label="upeer home"
          >
            <SiteLogo className="h-auto" markClassName="h-8 w-8" />
          </Link>
          <p className={`mt-4 max-w-sm text-sm leading-relaxed ${muted}`}>
            A P2P liquidity network. Exchange local currency and USDC without
            building the complexity yourself.
          </p>
        </div>
        <div>
          <p className={`text-[0.6875rem] uppercase tracking-[0.22em] ${faint}`}>
            Product
          </p>
          <ul className="mt-4 space-y-2">
            {LINKS.map((link) => (
              <li key={link.href}>
                <NavLink
                  href={link.href}
                  direction="none"
                  className={`inline-flex min-h-[40px] items-center text-sm ${muted} ${linkHover} focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent)]`}
                >
                  {link.label}
                </NavLink>
              </li>
            ))}
          </ul>
        </div>
        <div>
          <p className={`text-[0.6875rem] uppercase tracking-[0.22em] ${faint}`}>
            Developers
          </p>
          <p className={`mt-4 max-w-xs text-sm leading-relaxed ${muted}`}>
            APIs and SDKs for wallets and fintechs are coming. The merchant
            network stays with upeer.
          </p>
        </div>
      </div>
      <p className={`page-shell mt-10 text-[0.75rem] sm:mt-12 ${faint}`}>
        Testnet. Fiat settles between you and a verified merchant.
      </p>
    </footer>
  );
}
