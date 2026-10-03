import { AccountView } from '@/components/account/account-view';
import { DirectionalTransition } from '@/components/transition/directional-transition';
import { AppPage } from '@/components/ui/app-page';

export default function AccountPage() {
  return (
    <DirectionalTransition>
      <AppPage width="content">
        <AccountView />
      </AppPage>
    </DirectionalTransition>
  );
}
