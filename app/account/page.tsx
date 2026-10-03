import { AccountView } from '@/components/account/account-view';
import { DirectionalTransition } from '@/components/transition/directional-transition';
import { AppPage } from '@/components/ui/app-page';
import { ScreenHeader } from '@/components/ui/screen-header';

export default function AccountPage() {
  return (
    <DirectionalTransition>
      <AppPage width="content">
        <ScreenHeader title="Account" />
        <AccountView />
      </AppPage>
    </DirectionalTransition>
  );
}
