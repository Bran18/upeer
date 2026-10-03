import { MerchantApplyForm } from '@/components/merchant-apply-form';
import { MerchantDashboard } from '@/components/merchant-dashboard';
import { DirectionalTransition } from '@/components/transition/directional-transition';
import { AppPage } from '@/components/ui/app-page';
import { PageHeader } from '@/components/ui/page-header';

export default function MerchantPage() {
  return (
    <DirectionalTransition>
      <AppPage width="narrow">
        <PageHeader
          eyebrow="Merchant"
          title="Liquidity"
          description="Offers, payout rails, and how you supply the network. Additional tools stay here — not in the main nav."
        />
        <div className="space-y-10">
          <MerchantApplyForm />
          <MerchantDashboard />
        </div>
      </AppPage>
    </DirectionalTransition>
  );
}
