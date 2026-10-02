import { MerchantApplyForm } from '@/components/merchant-apply-form';
import { MerchantDashboard } from '@/components/merchant-dashboard';
import { DirectionalTransition } from '@/components/transition/directional-transition';
import { PageHeader } from '@/components/ui/page-header';

export default function MerchantPage() {
  return (
    <DirectionalTransition>
      <div className="mx-auto max-w-xl px-4 py-14 sm:px-6">
        <PageHeader
          eyebrow="Supply"
          title="Merchant desk"
          description="Apply for verification, set payout rails, and publish USDC offers. Testnet approval is manual."
        />
        <div className="space-y-10">
          <MerchantApplyForm />
          <MerchantDashboard />
        </div>
      </div>
    </DirectionalTransition>
  );
}
