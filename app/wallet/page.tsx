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
          description="Balances, receive details, send payments, and swap assets when you need to move or convert funds."
        />
        <div className="ui-card px-5 py-6 sm:px-6">
          <WalletView />
        </div>
      </AppPage>
    </DirectionalTransition>
  );
}
