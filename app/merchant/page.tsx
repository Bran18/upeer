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
          eyebrow="Supply"
          title="Merchant Desk"
          description="Apply for verification, set payout rails, and publish USDC offers. Testnet approval is manual."
        />
        <div className="space-y-10">
          <MerchantApplyForm />
          <MerchantDashboard />
        </div>
      </AppPage>
    </DirectionalTransition>
  );
}
