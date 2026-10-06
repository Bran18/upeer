import type { OrderDetail } from '@/lib/db/orders';
import { cn } from '@/lib/cn';

const STEPS = [
  {
    id: 'request',
    title: 'Request',
    body: 'The taker locked a size at the posted price.',
  },
  {
    id: 'accept',
    title: 'Accept',
    body: 'The desk accepts or declines the take.',
  },
  {
    id: 'escrow',
    title: 'Escrow',
    body: 'USDC moves through Trustless Work on Stellar.',
  },
  {
    id: 'fiat',
    title: 'Fiat',
    body: 'Local currency settles peer to peer, then both sides confirm.',
  },
  {
    id: 'release',
    title: 'Release',
    body: 'Escrow releases USDC after fiat is confirmed.',
  },
] as const;

function currentStepIndex(order: OrderDetail): number {
  switch (order.status) {
    case 'pending_acceptance':
      return 1;
    case 'declined':
    case 'cancelled':
      return 1;
    case 'created':
    case 'reserved':
    case 'escrow_pending': {
      const milestone = order.escrow?.milestone_state ?? '';
      if (
        milestone === 'funded' ||
        Boolean(order.fiat_confirmation.takerPaidAt)
      ) {
        return 3;
      }
      return 2;
    }
    case 'fiat_pending':
      return 3;
    case 'released':
      return 4;
    default:
      return 0;
  }
}

type Props = {
  order: OrderDetail;
  className?: string;
};

export function OrderProgressSteps({ order, className }: Props) {
  const stepIndex = currentStepIndex(order);

  return (
    <section className={cn('ui-card px-5 py-5 sm:px-6 sm:py-6', className)}>
      <h2 className="text-base font-semibold tracking-tight">Trade Progress</h2>
      <ol className="mt-4 space-y-3">
        {STEPS.map((step, index) => {
          const current = index === stepIndex;
          const passed = index < stepIndex;
          return (
            <li key={step.id} className="min-w-0">
              <p
                className={`text-sm font-medium ${
                  current
                    ? 'text-[var(--foreground)]'
                    : passed
                      ? 'text-[var(--foreground-secondary)]'
                      : 'text-[var(--foreground-tertiary)]'
                }`}
              >
                {index + 1}. {step.title}
                {current ? ' · Now' : ''}
              </p>
              <p className="mt-0.5 text-sm leading-relaxed text-[var(--foreground-secondary)] text-pretty">
                {step.body}
              </p>
            </li>
          );
        })}
      </ol>
    </section>
  );
}
