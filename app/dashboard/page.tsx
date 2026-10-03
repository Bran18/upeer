import { UserDashboard } from '@/components/dashboard/user-dashboard';
import { DirectionalTransition } from '@/components/transition/directional-transition';
import { AppPage } from '@/components/ui/app-page';

export default function DashboardPage() {
  return (
    <DirectionalTransition>
      <AppPage width="content">
        <UserDashboard />
      </AppPage>
    </DirectionalTransition>
  );
}
