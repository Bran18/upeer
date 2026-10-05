'use client';

import Link from 'next/link';
import { MerchantApplyForm } from '@/components/merchant/merchant-apply-form';
import {
  MerchantOfferRow,
  MerchantOffersEmpty,
} from '@/components/merchant/merchant-offer-row';
import { Badge } from '@/components/ui/badge';
import { formatUsdcLabel } from '@/lib/market/format';
import {
  merchantStatusBody,
  merchantStatusLabel,
} from '@/lib/merchant/copy';
import { merchantCanOperate } from '@/lib/merchant/status';
import type { MerchantOfferRow as OfferRow, MerchantRecord } from '@/lib/merchant/types';
import type { MeProfile } from '@/lib/profile/types';

type Props = {
  profile: MeProfile;
  merchant: MerchantRecord | null;
  offers: OfferRow[];
  onApplied: () => void;
};

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0 rounded-[var(--radius-ui)] border border-[var(--line)] px-4 py-4">
      <p className="exchange-kicker">{label}</p>
      <p className="mt-2 text-lg font-medium tracking-tight tabular-nums">{value}</p>
    </div>
  );
}

export function MerchantDesk({ profile, merchant, offers, onApplied }: Props) {
  const status = merchant?.status ?? profile.merchantStatus;
  const canApply = !merchant || status === 'rejected' || status === 'none';
  const canOperate = merchantCanOperate(status);
  const deskName =
    merchant?.display_name?.trim() ||
    profile.displayName?.trim() ||
    'Your desk';
  const openOffers = offers.filter((offer) => offer.status === 'open');
  const liveUsdc = openOffers.reduce((sum, offer) => {
    const n = Number(offer.available_usdc);
    return sum + (Number.isFinite(n) ? n : 0);
  }, 0);
  const markets = [...new Set(openOffers.map((offer) => offer.fiat_currency))];
  const payoutReady = Boolean(profile.payoutAddress);
  const railsReady = profile.paymentPrefs.methods.length > 0;
  const badgeVariant =
    canOperate
      ? 'success'
      : status === 'rejected' || status === 'suspended'
        ? 'muted'
        : 'default';

  const readiness = [
    {
      id: 'payout',
      title: 'Payout address',
      done: payoutReady,
      href: '/settings?tab=payout',
      hrefLabel: payoutReady ? 'Review' : 'Set payout',
      detail: payoutReady
        ? 'Escrow can release USDC to your wallet.'
        : 'Required before you post a sell order.',
    },
    {
      id: 'rails',
      title: 'Fiat payment methods',
      done: railsReady,
      href: '/settings?tab=fiat',
      hrefLabel: railsReady ? 'Review' : 'Add methods',
      detail: railsReady
        ? `${profile.paymentPrefs.methods.length} saved. Buyers use these to pay you.`
        : 'Add bank, PIX, or other rails so buyers know how to pay.',
    },
  ];

  return (
    <div className="space-y-10">
      {canApply ? null : (
        <section className="ui-card p-5 sm:p-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-base font-semibold tracking-tight">{deskName}</h2>
                <Badge variant={badgeVariant}>{merchantStatusLabel(status)}</Badge>
              </div>
              <p className="mt-2 max-w-md text-sm leading-relaxed text-[var(--foreground-secondary)] text-pretty">
                {merchantStatusBody(status)}
              </p>
            </div>
            {canOperate ? (
              <Link href="/orders/new" className="btn-primary shrink-0 self-start">
                Post order
              </Link>
            ) : null}
          </div>
        </section>
      )}

      {canOperate ? (
        <section aria-labelledby="merchant-book-stats">
          <h2 id="merchant-book-stats" className="sr-only">
            Book summary
          </h2>
          <div className="grid gap-3 sm:grid-cols-3">
            <Stat
              label="Live orders"
              value={String(openOffers.length)}
            />
            <Stat
              label="USDC on the book"
              value={openOffers.length > 0 ? formatUsdcLabel(String(liveUsdc)) : '—'}
            />
            <Stat
              label="Markets"
              value={markets.length > 0 ? markets.join(' · ') : '—'}
            />
          </div>
        </section>
      ) : null}

      <section aria-labelledby="merchant-ready-heading">
        <h2 id="merchant-ready-heading" className="text-sm font-medium">
          Ready to operate
        </h2>
        <ul className="mt-3">
          {readiness.map((item) => (
            <li
              key={item.id}
              className="flex flex-wrap items-baseline justify-between gap-2 border-b border-[var(--line)] py-3 last:border-b-0"
            >
              <div className="min-w-0 max-w-lg">
                <p className="text-sm">
                  {item.title}
                  <span className="ml-2 text-xs text-[var(--foreground-tertiary)]">
                    {item.done ? 'Ready' : 'Needed'}
                  </span>
                </p>
                <p className="mt-1 text-xs leading-relaxed text-[var(--foreground-secondary)] text-pretty">
                  {item.detail}
                </p>
              </div>
              {item.href && item.hrefLabel ? (
                <Link
                  href={item.href}
                  className="text-sm font-medium text-[var(--accent)] hover:text-[var(--accent-hover)]"
                >
                  {item.hrefLabel}
                </Link>
              ) : null}
            </li>
          ))}
        </ul>
      </section>

      {canApply ? (
        <MerchantApplyForm
          defaultName={profile.displayName ?? ''}
          onSubmitted={onApplied}
        />
      ) : null}

      {merchant && status !== 'rejected' ? (
        <section aria-labelledby="merchant-offers-heading">
          <div className="mb-3 flex items-end justify-between gap-3">
            <div>
              <h2 id="merchant-offers-heading" className="text-sm font-medium">
                Your orders
              </h2>
              <p className="mt-1 text-xs text-[var(--foreground-secondary)]">
                Live listings on Market. Open an order to inspect the public view.
              </p>
            </div>
            <Link
              href="/orders"
              className="text-sm font-medium text-[var(--accent)] hover:text-[var(--accent-hover)]"
            >
              Trades
            </Link>
          </div>
          {offers.length === 0 ? (
            <MerchantOffersEmpty canPost={canOperate && payoutReady} />
          ) : (
            <ul className="grid list-none gap-2">
              {offers.map((offer) => (
                <MerchantOfferRow key={offer.id} offer={offer} />
              ))}
            </ul>
          )}
        </section>
      ) : null}

      <p className="text-xs leading-relaxed text-[var(--foreground-tertiary)] text-pretty">
        Performance lives on{' '}
        <Link href="/dashboard" className="font-medium text-[var(--accent)] hover:underline">
          Performance
        </Link>
        . Wallet balances stay in{' '}
        <Link href="/wallet" className="font-medium text-[var(--accent)] hover:underline">
          Wallet
        </Link>
        .
      </p>
    </div>
  );
}
