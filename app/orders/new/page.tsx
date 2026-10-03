import { PostOrderForm } from '@/components/orders/post-order-form';
import { AppPage } from '@/components/ui/app-page';
import { DirectionalTransition } from '@/components/transition/directional-transition';

export default function NewOrderPage() {
  return (
    <DirectionalTransition>
      <AppPage width="content">
        <PostOrderForm />
      </AppPage>
    </DirectionalTransition>
  );
}
