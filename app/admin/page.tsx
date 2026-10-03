import { AdminDashboard } from '@/components/admin/admin-dashboard';
import { AppPage } from '@/components/ui/app-page';
import { DirectionalTransition } from '@/components/transition/directional-transition';

export default function AdminPage() {
  return (
    <DirectionalTransition>
      <AppPage width="content">
        <header className="mb-8">
          <h1 className="text-2xl font-medium tracking-tight">Admin</h1>
          <p className="mt-2 text-sm text-[var(--foreground-secondary)]">
            Operator tools for verification and order oversight.
          </p>
        </header>
        <AdminDashboard />
      </AppPage>
    </DirectionalTransition>
  );
}
