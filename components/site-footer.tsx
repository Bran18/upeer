import { NavLink } from '@/components/transition/nav-link';

const LINKS = [
  { href: '/market', label: 'Market' },
  { href: '/merchant', label: 'Merchants' },
  { href: '/app', label: 'Console' },
  { href: '/onboarding', label: 'Onboarding' },
] as const;

const STACK = [
  { name: 'Pollar', role: 'Login & wallet' },
  { name: 'Reflector', role: 'FX reference' },
  { name: 'Trustless Work', role: 'Escrow' },
  { name: 'Soroswap', role: 'Optional swap' },
] as const;

export function SiteFooter() {
  return (
    <footer className="border-t border-[var(--line)] bg-[var(--background-secondary)] pb-[max(2.5rem,env(safe-area-inset-bottom))] pt-10 sm:pt-12">
      <div className="page-shell grid gap-8 sm:grid-cols-2 sm:gap-10 lg:grid-cols-3">
        <div className="sm:col-span-2 lg:col-span-1">
          <p className="font-mono text-[0.75rem] tracking-[0.2em]">UPEER</p>
          <p className="mt-3 max-w-sm text-sm leading-relaxed text-[var(--foreground-secondary)]">
            USDC OTC on Stellar. Quotes you can lock. Escrow you can verify.
          </p>
        </div>
        <div>
          <p className="text-caption uppercase tracking-[0.16em]">Go</p>
          <ul className="mt-3 space-y-2">
            {LINKS.map((link) => (
              <li key={link.href}>
                <NavLink
                  href={link.href}
                  direction="none"
                  className="inline-flex min-h-[40px] items-center text-sm text-[var(--foreground-secondary)] hover:text-[var(--foreground)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent)]"
                >
                  {link.label}
                </NavLink>
              </li>
            ))}
          </ul>
        </div>
        <div>
          <p className="text-caption uppercase tracking-[0.16em]">Stack</p>
          <ul className="mt-3 space-y-2">
            {STACK.map((item) => (
              <li
                key={item.name}
                className="flex flex-col gap-0.5 text-sm sm:flex-row sm:justify-between sm:gap-4"
                translate="no"
              >
                <span>{item.name}</span>
                <span className="text-[var(--foreground-tertiary)] sm:text-right">
                  {item.role}
                </span>
              </li>
            ))}
          </ul>
        </div>
      </div>
      <p className="page-shell mt-10 text-caption sm:mt-12">
        Testnet only. Fiat settles off-chain. A declaration is not a payment.
      </p>
    </footer>
  );
}
