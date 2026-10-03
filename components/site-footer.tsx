import Link from 'next/link';
import { SiteLogo } from '@/components/site-logo';
import { NavLink } from '@/components/transition/nav-link';
import { footerLinks } from '@/lib/nav/user-links';

const LINKS = footerLinks();

const STACK = [
  { name: 'Pollar', role: 'Login & wallet' },
  { name: 'Reflector', role: 'FX reference' },
  { name: 'Trustless Work', role: 'Escrow' },
  { name: 'Soroswap', role: 'Optional swap' },
] as const;

export function SiteFooter({ landing = false }: { landing?: boolean }) {
  const muted = landing ? 'text-white/70' : 'text-[var(--foreground-secondary)]';
  const faint = landing ? 'text-white/45' : 'text-[var(--foreground-tertiary)]';
  const linkHover = landing ? 'hover:text-white' : 'hover:text-[var(--foreground)]';

  return (
    <footer
      id="site-footer"
      className={`relative z-[2] border-t pb-[max(2.5rem,env(safe-area-inset-bottom))] pt-10 sm:pt-12 ${
        landing
          ? 'border-white/10 bg-[#070b14] text-[#f4f4f4]'
          : 'border-[var(--line)]'
      }`}
    >
      <div className="page-shell grid gap-10 sm:grid-cols-2 lg:grid-cols-3">
        <div className="sm:col-span-2 lg:col-span-1">
          <Link
            href="/"
            translate="no"
            className="inline-block rounded-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[var(--accent)]"
            aria-label="UPEER home"
          >
            <SiteLogo className="h-10 w-auto" />
          </Link>
          <p className={`mt-4 max-w-sm text-sm leading-relaxed ${muted}`}>
            USDC OTC on Stellar. Quotes you can lock. Escrow you can verify.
          </p>
        </div>
        <div>
          <p className={`text-[0.6875rem] uppercase tracking-[0.22em] ${faint}`}>
            Go
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
            Stack
          </p>
          <ul className="mt-4 space-y-2">
            {STACK.map((item) => (
              <li
                key={item.name}
                className="flex flex-col gap-0.5 text-sm sm:flex-row sm:justify-between sm:gap-4"
                translate="no"
              >
                <span>{item.name}</span>
                <span className={`${faint} sm:text-right`}>
                  {item.role}
                </span>
              </li>
            ))}
          </ul>
        </div>
      </div>
      <p className={`page-shell mt-10 text-[0.75rem] sm:mt-12 ${faint}`}>
        Testnet only. Fiat settles off-chain. A declaration is not a payment.
      </p>
    </footer>
  );
}
