import { Suspense } from 'react';
import { SettingsView } from '@/components/settings/settings-view';
import { DirectionalTransition } from '@/components/transition/directional-transition';
import { AppPage } from '@/components/ui/app-page';

export default function SettingsPage() {
  return (
    <DirectionalTransition>
      <AppPage width="content">
        <Suspense fallback={<p className="text-sm text-[var(--foreground-secondary)]">Loading…</p>}>
          <SettingsView />
        </Suspense>
      </AppPage>
    </DirectionalTransition>
  );
}
