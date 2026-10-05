'use client';

import { usePollar } from '@pollar/react';
import Link from 'next/link';
import { useCallback, useEffect, useState } from 'react';
import { MerchantDesk } from '@/components/merchant/merchant-desk';
import { MerchantPitch } from '@/components/merchant/merchant-pitch';
import { PollarRequired } from '@/components/pollar-required';
import { useUpeerSession } from '@/components/session/upeer-session-provider';
import { Button } from '@/components/ui/button';
import { ScreenHeader } from '@/components/ui/screen-header';
import type { MerchantOfferRow, MerchantRecord } from '@/lib/merchant/types';
import { merchantCanOperate } from '@/lib/merchant/status';
import { onboardingComplete } from '@/lib/profile/types';
import {
  exchangePollarSessionFromClient,
  readStoredSession,
  upeerAuthedFetch,
} from '@/lib/upeer-api';

function MerchantViewInner() {
  const { isAuthenticated, verified, getClient, openLoginModal } = usePollar();
  const { profile, status: sessionStatus } = useUpeerSession();
  const [merchant, setMerchant] = useState<MerchantRecord | null>(null);
  const [offers, setOffers] = useState<MerchantOfferRow[]>([]);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [loadingDesk, setLoadingDesk] = useState(false);

  const loadDesk = useCallback(async () => {
    let session = readStoredSession();
    if (!session) {
      const auth = getClient().getAuthState();
      if (auth.step !== 'authenticated') {
        return;
      }
      session = await exchangePollarSessionFromClient(getClient());
    }
    const res = await upeerAuthedFetch('/api/merchants/me');
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error ?? 'Could not load this desk');
    }
    setMerchant(data.merchant ?? null);
    setOffers(data.offers ?? []);
  }, [getClient]);

  useEffect(() => {
    if (!isAuthenticated || !verified) {
      return;
    }
    setLoadingDesk(true);
    void loadDesk()
      .catch((error: unknown) => {
        setLoadError(error instanceof Error ? error.message : 'Could not load this desk');
      })
      .finally(() => {
        setLoadingDesk(false);
      });
  }, [isAuthenticated, verified, loadDesk]);

  const signedIn = isAuthenticated && verified;
  const onboarded = profile ? onboardingComplete(profile) : false;
  const hasDesk =
    Boolean(merchant) ||
    (profile?.merchantStatus != null && profile.merchantStatus !== 'none');

  if (!signedIn) {
    return (
      <div>
        <ScreenHeader
          title="Sell USDC from your desk"
          description="Quote a price in local currency, settle fiat peer to peer, and let escrow move USDC on Stellar. Testnet."
          action={
            <Button type="button" onClick={() => openLoginModal()}>
              Sign in to list
            </Button>
          }
        />
        <MerchantPitch />
      </div>
    );
  }

  if (sessionStatus === 'syncing' || (signedIn && !profile && sessionStatus !== 'error')) {
    return (
      <p className="text-sm text-[var(--foreground-secondary)]" role="status" aria-live="polite">
        Loading your desk…
      </p>
    );
  }

  if (!profile || !onboarded) {
    return (
      <div className="space-y-10">
        <ScreenHeader
          title="Finish setup to list a desk"
          description="Choose sell — or buy and sell — during setup. Your public name is what takers see."
          action={
            <Link href="/onboarding" className="btn-primary">
              Continue setup
            </Link>
          }
        />
        <MerchantPitch />
      </div>
    );
  }

  return (
    <div className="space-y-10">
      <ScreenHeader
        title={hasDesk ? 'Desk' : 'Become a merchant'}
        description={
          hasDesk
            ? 'Payout rails and the orders you supply to the book.'
            : 'List a public desk. Buyers take your price; escrow protects the on-chain leg.'
        }
        action={
          merchant && merchantCanOperate(merchant.status) ? (
            <Link href="/orders/new" className="btn-primary">
              Post order
            </Link>
          ) : undefined
        }
      />

      {hasDesk ? null : <MerchantPitch />}

      {loadError ? (
        <p className="text-sm text-red-800 dark:text-red-200" role="status">
          {loadError}
        </p>
      ) : null}

      {loadingDesk && !merchant && hasDesk ? (
        <p className="text-sm text-[var(--foreground-tertiary)]" role="status" aria-live="polite">
          Loading desk status…
        </p>
      ) : (
        <MerchantDesk
          profile={profile}
          merchant={merchant}
          offers={offers}
          onApplied={() => {
            setLoadError(null);
            void loadDesk().catch((error: unknown) => {
              setLoadError(
                error instanceof Error ? error.message : 'Could not refresh this desk',
              );
            });
          }}
        />
      )}
    </div>
  );
}

export function MerchantView() {
  return (
    <PollarRequired>
      <MerchantViewInner />
    </PollarRequired>
  );
}
