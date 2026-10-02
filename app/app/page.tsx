import { UpeerConsole } from '@/components/app/upeer-console';
import { DirectionalTransition } from '@/components/transition/directional-transition';

export default function AppConsolePage() {
  return (
    <DirectionalTransition>
      <div className="mx-auto max-w-4xl px-4 py-14 sm:px-6">
        <UpeerConsole />
      </div>
    </DirectionalTransition>
  );
}
