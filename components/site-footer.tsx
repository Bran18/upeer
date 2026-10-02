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
    <footer className="border-t border-[var(--line)] bg-[var(--background-secondary)] px-5 pb-[max(2.5rem,env(safe-area-inset-bottom))] pt-12 sm:px-8">
      <div className="mx-auto grid max-w-[1120px] gap-10 sm:grid-cols-3">
        <div>
          <p className="font-mono text-[0.75rem] tracking-[0.2em]">UPEER</p>
          <p className="mt-3 max-w-xs text-sm leading-relaxed text-[var(--foreground-secondary)]">
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
                  className="text-sm text-[var(--foreground-secondary)] hover:text-[var(--foreground)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent)]"
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
                className="flex justify-between gap-4 text-sm"
                translate="no"
              >
                <span>{item.name}</span>
                <span className="text-[var(--foreground-tertiary)]">
                  {item.role}
                </span>
              </li>
            ))}
          </ul>
        </div>
      </div>
      <p className="mx-auto mt-12 max-w-[1120px] text-caption">
        Testnet only. Fiat settles off-chain. A declaration is not a payment.
      </p>
    </footer>
  );
}
