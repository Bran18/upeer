import { WalletView } from '@/components/wallet/wallet-view';
import { AppPage } from '@/components/ui/app-page';
import { ScreenHeader } from '@/components/ui/screen-header';
import { DirectionalTransition } from '@/components/transition/directional-transition';

export default function WalletPage() {
  return (
    <DirectionalTransition>
      <AppPage width="wide">
        <ScreenHeader title="Wallet" />
        <WalletView />
      </AppPage>
    </DirectionalTransition>
  );
}
