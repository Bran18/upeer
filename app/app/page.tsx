import { UpeerConsole } from '@/components/app/upeer-console';
import { DirectionalTransition } from '@/components/transition/directional-transition';

export default function AppConsolePage() {
  return (
    <DirectionalTransition>
      <div className="mx-auto max-w-[980px] px-6 py-16 sm:py-20">
        <UpeerConsole />
      </div>
    </DirectionalTransition>
  );
}
