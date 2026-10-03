'use client';

import { PostOrderView } from '@/components/orders/post-order-view';
import { PollarRequired } from '@/components/pollar-required';

export function PostOrderForm() {
  return (
    <PollarRequired>
      <PostOrderView />
    </PollarRequired>
  );
}
