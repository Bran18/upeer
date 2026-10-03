import { SoroswapSection } from '@/components/dashboard/soroswap-section';
import { WalletView } from '@/components/wallet/wallet-view';
import { AppPage } from '@/components/ui/app-page';
import { ScreenHeader } from '@/components/ui/screen-header';
import { DirectionalTransition } from '@/components/transition/directional-transition';

export default function WalletPage() {
  return (
    <DirectionalTransition>
      <AppPage width="content">
        <ScreenHeader
          title="Wallet"
          description="Balances, receive details, and send USDC when you need to move funds yourself."
        />
        <div className="ui-card px-5 py-6 sm:px-6">
          <WalletView />
        </div>
        <div className="ui-card mt-4 px-5 py-6 sm:px-6">
          <SoroswapSection />
        </div>
      </AppPage>
    </DirectionalTransition>
  );
}
