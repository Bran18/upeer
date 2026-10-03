import {
  formatPricePerUsdc,
  formatUsdcAmount,
  orderSideLabel,
} from '@/lib/market/format';
import type { PostOrderFormState } from '@/lib/orders/post-order-types';
type Props = {
  form: PostOrderFormState;
  effectivePayout: string;
  onEditStep: (step: 1 | 2 | 3) => void;
};

function PostOrderStepPanel({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <section className="space-y-4">
      <div>
        <h2
          id="post-order-review-title"
          className="text-sm font-medium text-[var(--foreground)]"
        >
          {title}
        </h2>
        <p className="mt-1 text-xs leading-relaxed text-[var(--foreground-tertiary)] text-pretty">
          {description}
        </p>
      </div>
      {children}
    </section>
  );
}

function ReviewRow({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="grid grid-cols-[minmax(5rem,7.5rem)_minmax(0,1fr)] items-start gap-x-4 gap-y-1">
      <dt className="pt-0.5 text-[var(--foreground-tertiary)]">{label}</dt>
      <dd className="min-w-0 text-right font-medium text-[var(--foreground)]">{children}</dd>
    </div>
  );
}

function EditLink({ onClick }: { onClick: () => void }) {
  return (
    <button
      type="button"
      className="shrink-0 text-xs font-medium text-[var(--accent)] hover:underline"
      onClick={onClick}
    >
      Edit
    </button>
  );
}

function ReviewValueWithEdit({
  value,
  onEdit,
  className,
}: {
  value: React.ReactNode;
  onEdit: () => void;
  className?: string;
}) {
  return (
    <div className="flex min-w-0 items-start justify-end gap-2">
      <span className={className}>{value}</span>
      <EditLink onClick={onEdit} />
    </div>
  );
}

export function PostOrderReviewStep({
  form,
  effectivePayout,
  onEditStep,
}: Props) {
  const payoutDisplay =
    effectivePayout.length > 20
      ? `${effectivePayout.slice(0, 8)}…${effectivePayout.slice(-8)}`
      : effectivePayout;

  return (
    <PostOrderStepPanel
      title="Review Listing"
      description="Check everything below. Use Edit to change trade, amount, or payout."
    >
      <dl className="space-y-4 text-sm">
        <ReviewRow label="Side">
          <ReviewValueWithEdit
            value={orderSideLabel(form.side)}
            onEdit={() => onEditStep(1)}
          />
        </ReviewRow>
        <ReviewRow label="Price">
          <ReviewValueWithEdit
            value={
              <span className="tabular-nums">
                {formatPricePerUsdc(form.fiatCurrency, form.pricePerUsdc)}
              </span>
            }
            onEdit={() => onEditStep(1)}
          />
        </ReviewRow>
        <ReviewRow label="Listing size">
          <ReviewValueWithEdit
            value={
              <span className="tabular-nums">
                {formatUsdcAmount(form.availableUsdc)} USDC
              </span>
            }
            onEdit={() => onEditStep(2)}
          />
        </ReviewRow>
        <ReviewRow label="Per trade">
          <ReviewValueWithEdit
            value={
              <span className="tabular-nums">
                {formatUsdcAmount(form.minUsdc)} – {formatUsdcAmount(form.maxUsdc)} USDC
              </span>
            }
            onEdit={() => onEditStep(2)}
          />
        </ReviewRow>
        <ReviewRow label="Payout">
          <ReviewValueWithEdit
            value={
              <code
                className="font-mono text-xs font-normal tabular-nums"
                title={effectivePayout}
                translate="no"
              >
                {payoutDisplay}
              </code>
            }
            onEdit={() => onEditStep(3)}
          />
        </ReviewRow>
      </dl>
    </PostOrderStepPanel>
  );
}
