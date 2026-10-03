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
              <p className="settings-hero-kicker">Stellar wallet</p>
              <h1 className="mt-2 text-2xl font-semibold tracking-tight sm:text-3xl">
                Wallet &amp; assets
              </h1>
              <p className="mt-2 text-sm leading-relaxed text-white/85 text-pretty">
                Check balances, receive funds, and send XLM or USDC to any Stellar
                address — with an optional text or ID memo when required.
              </p>
            </div>
            <div className="settings-hero-art" aria-hidden>
              <span className="settings-hero-icon">💫</span>
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
