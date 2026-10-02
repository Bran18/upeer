import { UpeerConsole } from '@/components/app/upeer-console';
import { DirectionalTransition } from '@/components/transition/directional-transition';
import { AppPage } from '@/components/ui/app-page';

export default function AppConsolePage() {
  return (
    <DirectionalTransition>
      <AppPage width="content">
        <UpeerConsole />
      </AppPage>
    </DirectionalTransition>
  );
}
