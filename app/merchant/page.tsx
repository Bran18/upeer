import type { Metadata } from 'next';
import { MerchantView } from '@/components/merchant/merchant-view';
import { DirectionalTransition } from '@/components/transition/directional-transition';
import { AppPage } from '@/components/ui/app-page';

export const metadata: Metadata = {
  title: 'Merchant desk',
  description:
    'List as a upeer merchant: post USDC prices in local currency, settle fiat peer to peer, and receive payouts through on-chain escrow.',
};

export default function MerchantPage() {
  return (
    <DirectionalTransition>
      <AppPage width="content">
        <MerchantView />
      </AppPage>
    </DirectionalTransition>
  );
}
