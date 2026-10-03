import { WalletView } from '@/components/wallet/wallet-view';
import { AppPage } from '@/components/ui/app-page';
import { DirectionalTransition } from '@/components/transition/directional-transition';

export default function WalletPage() {
  return (
    <DirectionalTransition>
      <AppPage width="content">
        <div className="space-y-0">
          <div className="settings-hero">
            <div className="relative z-[1] max-w-xl">
              <p className="settings-hero-kicker">Wallet</p>
              <h1 className="mt-2 text-2xl font-semibold tracking-tight sm:text-3xl">
                Wallet
              </h1>
              <p className="mt-2 text-sm leading-relaxed text-[var(--foreground-secondary)] text-pretty">
                Balances, receive details, and send USDC when you need to move
                funds yourself.
              </p>
            </div>
            <div className="settings-hero-art" aria-hidden>
              <span className="settings-hero-icon text-[var(--accent)]">
                <svg viewBox="0 0 32 32" className="h-10 w-10" aria-hidden>
                  <rect x="4" y="8" width="24" height="16" rx="4" fill="currentColor" opacity="0.2" />
                  <rect x="4" y="8" width="24" height="16" rx="4" stroke="currentColor" strokeWidth="1.5" fill="none" />
                  <circle cx="21" cy="16" r="2" fill="currentColor" />
                </svg>
              </span>
            </div>
          </div>

          <div className="ui-card mt-4 px-5 py-6 sm:px-6">
            <WalletView />
          </div>
        </div>
      </AppPage>
    </DirectionalTransition>
  );
}
