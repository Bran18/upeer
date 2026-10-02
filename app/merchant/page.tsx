import { MerchantApplyForm } from '@/components/merchant-apply-form';
import { MerchantDashboard } from '@/components/merchant-dashboard';

export default function MerchantPage() {
  return (
    <div className="mx-auto max-w-xl px-4 py-12 sm:px-6">
      <h1 className="text-2xl font-semibold">Merchants</h1>
      <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
        Apply for verification, set your payout address, and publish USDC OTC
        offers. Approval is manual on testnet (
        <code className="text-xs">POST /api/admin/merchants/:id/decision</code>{' '}
        with <code className="text-xs">x-upeer-operator-key</code>).
      </p>
      <div className="mt-8">
        <MerchantApplyForm />
        <MerchantDashboard />
      </div>
    </div>
  );
}
