import { PostOrderForm } from '@/components/orders/post-order-form';
import { AppPage } from '@/components/ui/app-page';
import { DirectionalTransition } from '@/components/transition/directional-transition';

export default function NewOrderPage() {
  return (
    <DirectionalTransition>
      <AppPage width="content">
        <header className="mb-8">
          <h1 className="text-2xl font-medium tracking-tight">Post order</h1>
          <p className="mt-2 text-sm text-[var(--foreground-secondary)]">
            List USDC at your price. Others can request a trade; you accept
            before escrow.
          </p>
        </header>
        <PostOrderForm />
      </AppPage>
    </DirectionalTransition>
  );
}
