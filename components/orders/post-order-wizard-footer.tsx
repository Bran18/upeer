import Link from 'next/link';
import { Button } from '@/components/ui/button';

type EditFooterProps = {
  step: 1 | 2 | 3;
  submitting: boolean;
  onBack: () => void;
  onContinue: () => void;
};

type ReviewFooterProps = {
  submitting: boolean;
  reviewConfirmed: boolean;
  onBack: () => void;
  onConfirmReview: () => void;
  onPost: () => void;
};

export function PostOrderEditFooter({
  step,
  submitting,
  onBack,
  onContinue,
}: EditFooterProps) {
  return (
    <div className="mt-6 flex flex-wrap items-center gap-3 border-t border-[var(--line)] pt-5">
      {step > 1 ? (
        <Button type="button" variant="secondary" onClick={onBack} disabled={submitting}>
          Back
        </Button>
      ) : (
        <Link
          href="/market"
          className="inline-flex min-h-11 items-center px-1 text-sm font-medium text-[var(--foreground-secondary)] hover:text-[var(--foreground)]"
        >
          Cancel
        </Link>
      )}
      <Button
        type="button"
        disabled={submitting}
        className="ml-auto"
        onClick={onContinue}
      >
        Continue
      </Button>
    </div>
  );
}

export function PostOrderReviewFooter({
  submitting,
  reviewConfirmed,
  onBack,
  onConfirmReview,
  onPost,
}: ReviewFooterProps) {
  return (
    <div className="mt-6 flex flex-col gap-3 border-t border-[var(--line)] pt-5">
      {!reviewConfirmed ? (
        <p className="text-sm text-[var(--foreground-secondary)] text-pretty">
          Read the summary above. Confirm when you are ready to publish.
        </p>
      ) : null}
      <div className="flex flex-wrap items-center gap-3">
        <Button type="button" variant="secondary" onClick={onBack} disabled={submitting}>
          Back
        </Button>
        {reviewConfirmed ? (
          <Button
            type="button"
            disabled={submitting}
            aria-busy={submitting}
            className="ml-auto"
            onClick={onPost}
          >
            {submitting ? 'Posting…' : 'Post to Market'}
          </Button>
        ) : (
          <Button type="button" className="ml-auto" onClick={onConfirmReview}>
            Confirm Review
          </Button>
        )}
      </div>
    </div>
  );
}
