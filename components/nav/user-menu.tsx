'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { usePollar } from '@pollar/react';
import { useCallback, useEffect, useId, useMemo, useRef, useState } from 'react';
import { hasPollarPublishableKey } from '@/components/pollar-required';
import { UserIdentitySummary } from '@/components/nav/user-identity-summary';
import { useOptionalUpeerSession } from '@/components/session/upeer-session-provider';
import { Avatar } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { IconChevronDown } from '@/components/ui/icons/chevron';
import { useToast } from '@/components/ui/toaster';
import { useDismissible } from '@/hooks/use-dismissible';
import { cn } from '@/lib/cn';
import {
  accountMenuLinks,
  resolveUserIdentity,
  roleLabel,
} from '@/lib/nav/user-links';

type UserMenuProps = {
  overlay?: boolean;
};

export function UserMenu({ overlay = false }: UserMenuProps) {
  if (!hasPollarPublishableKey()) {
    return null;
  }
  return <UserMenuInner overlay={overlay} />;
}

function UserMenuInner({ overlay }: UserMenuProps) {
  const menuId = useId();
  const pathname = usePathname();
  const panelRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const [open, setOpen] = useState(false);
  const toast = useToast();

  const {
    isAuthenticated,
    wallet,
    openLoginModal,
    logout,
  } = usePollar();
  const session = useOptionalUpeerSession();

  const profile = session?.profile;
  const role = roleLabel(profile?.platformIntent);

  const identity = useMemo(
    () =>
      resolveUserIdentity({
        profile,
        sessionStatus: session?.status,
        walletAddress: profile?.stellarAddress ?? wallet?.address ?? null,
      }),
    [profile, session?.status, wallet?.address],
  );

  const walletFull =
    profile?.stellarAddress ?? wallet?.address ?? null;

  const close = useCallback(() => setOpen(false), []);
  useDismissible(open, close, [panelRef, triggerRef]);

  useEffect(() => {
    close();
  }, [pathname, close]);

  if (!isAuthenticated) {
    return (
      <Button
        type="button"
        size="sm"
        className={cn(
          overlay &&
            'border-white/20 bg-white text-[#070b14] hover:bg-white/90',
        )}
        onClick={() => openLoginModal()}
      >
        Sign in
      </Button>
    );
  }

  const menuLinks = accountMenuLinks(profile);

  async function handleSignOut() {
    close();
    if (session) {
      await session.signOut();
    } else {
      logout();
    }
  }

  async function handleCopyWallet() {
    if (!walletFull) {
      return;
    }
    try {
      await navigator.clipboard.writeText(walletFull);
      toast.success('Address copied', 'Stellar wallet is on your clipboard.');
    } catch {
      toast.error('Could not copy', 'Allow clipboard access or copy from Settings.');
    }
  }

  return (
    <div className="relative">
      <button
        ref={triggerRef}
        type="button"
        className={cn(
          'inline-flex max-w-[14rem] min-h-11 min-w-0 items-center gap-2 rounded-[var(--radius-pill,9999px)] border px-2 py-1.5 text-left transition-[background-color,border-color] duration-200 touch-manipulation',
          'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2',
          overlay
            ? 'border-white/20 bg-white/10 text-white hover:bg-white/14 focus-visible:outline-white'
            : 'border-[var(--line)] bg-[var(--surface)] hover:border-[var(--foreground-tertiary)] focus-visible:outline-[var(--accent)]',
        )}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls={menuId}
        aria-busy={identity.loading}
        onClick={() => setOpen((value) => !value)}
      >
        <Avatar label={identity.avatarLabel} src={profile?.avatarUrl} size="sm" />
        <span className="hidden min-w-0 flex-1 flex-col sm:flex">
          <span
            className={cn(
              'truncate text-sm font-medium leading-tight',
              identity.promptDisplayName &&
                !overlay &&
                'text-[var(--accent)]',
            )}
          >
            {identity.primaryLabel}
          </span>
          {role ? (
            <span
              className={cn(
                'truncate text-[0.6875rem] text-[var(--foreground-tertiary)]',
                overlay && 'text-white/65',
              )}
            >
              {role}
            </span>
          ) : identity.walletLine ? (
            <span
              className={cn(
                'truncate font-mono text-[0.6875rem] text-[var(--foreground-tertiary)]',
                overlay && 'text-white/65',
              )}
              translate="no"
            >
              {identity.walletLine}
            </span>
          ) : null}
        </span>
        <IconChevronDown open={open} className={overlay ? 'text-white/80' : undefined} />
      </button>

      {open ? (
        <div
          ref={panelRef}
          id={menuId}
          role="menu"
          className="menu-panel absolute right-0 z-[80] mt-2 w-[min(17rem,calc(100vw-2rem))] overflow-hidden py-1.5"
        >
          <div className="border-b border-[var(--line)] px-3.5 py-3">
            <UserIdentitySummary
              identity={identity}
              platformIntent={profile?.platformIntent}
              avatarUrl={profile?.avatarUrl}
              walletTitle={walletFull}
            />
          </div>

          <div className="p-1.5">
            {menuLinks.map((link) => {
              const active =
                pathname === link.href || pathname.startsWith(`${link.href}/`);
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  role="menuitem"
                  className={cn(
                    'menu-item rounded-[calc(var(--radius-ui)-2px)]',
                    active && 'menu-item--active',
                  )}
                  onClick={close}
                >
                  {link.label}
                </Link>
              );
            })}
          </div>

          <div className="border-t border-[var(--line)] p-1.5">
            {walletFull ? (
              <button
                type="button"
                role="menuitem"
                className="menu-item rounded-[calc(var(--radius-ui)-2px)]"
                onClick={() => void handleCopyWallet()}
              >
                Copy wallet address
              </button>
            ) : null}
            <button
              type="button"
              role="menuitem"
              className="menu-item menu-item--danger rounded-[calc(var(--radius-ui)-2px)] text-red-600 dark:text-red-300"
              onClick={() => void handleSignOut()}
            >
              Sign out
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
