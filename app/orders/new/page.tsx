import { PostOrderView } from '@/components/orders/post-order-view';
import { PollarRequired } from '@/components/pollar-required';
import { AppPage } from '@/components/ui/app-page';
import { DirectionalTransition } from '@/components/transition/directional-transition';

export default function NewOrderPage() {
  return (
    <DirectionalTransition>
      <AppPage width="wide">
        <PollarRequired>
          <PostOrderView />
        </PollarRequired>
      </AppPage>
    </DirectionalTransition>
  );
}
