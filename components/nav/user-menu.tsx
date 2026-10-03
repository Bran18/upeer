'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { usePollar } from '@pollar/react';
import { useCallback, useEffect, useId, useRef, useState } from 'react';
import { hasPollarPublishableKey } from '@/components/pollar-required';
import { useOptionalUpeerSession } from '@/components/session/upeer-session-provider';
import { Avatar } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { IconChevronDown } from '@/components/ui/icons/chevron';
import { useDismissible } from '@/hooks/use-dismissible';
import { cn } from '@/lib/cn';
import {
  accountMenuLinks,
  menuTriggerLabel,
  roleLabel,
  shortenWallet,
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

  const { isAuthenticated, wallet, openLoginModal, logout } = usePollar();
  const session = useOptionalUpeerSession();

  const profile = session?.profile;
  const isOnboarded = Boolean(session?.isOnboarded);
  const role = roleLabel(profile?.platformIntent);
  const walletShort = wallet?.address ? shortenWallet(wallet.address) : null;

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
  const label = menuTriggerLabel(profile?.displayName, wallet?.address);

  async function handleSignOut() {
    close();
    if (session) {
      await session.signOut();
    } else {
      logout();
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
        onClick={() => setOpen((value) => !value)}
      >
        <Avatar label={label} size="sm" />
        <span className="hidden min-w-0 flex-1 flex-col sm:flex">
          <span className="truncate text-sm font-medium leading-tight">{label}</span>
          {role ? (
            <span
              className={cn(
                'truncate text-[0.6875rem] text-[var(--foreground-tertiary)]',
                overlay && 'text-white/65',
              )}
            >
              {role}
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
            <div className="flex items-start gap-2.5">
              <Avatar label={label} />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold">{label}</p>
                {walletShort ? (
                  <p
                    className="mt-0.5 truncate font-mono text-xs text-[var(--foreground-secondary)]"
                    translate="no"
                    title={wallet?.address}
                  >
                    {walletShort}
                  </p>
                ) : null}
                {role ? (
                  <Badge variant="accent" className="mt-2">
                    {role}
                  </Badge>
                ) : (
                  <Badge variant="muted" className="mt-2">
                    Setup incomplete
                  </Badge>
                )}
              </div>
            </div>
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
                  className={cn('menu-item rounded-[calc(var(--radius-ui)-2px)]', active && 'menu-item--active')}
                  onClick={close}
                >
                  {link.label}
                </Link>
              );
            })}
          </div>

          <div className="border-t border-[var(--line)] p-1.5">
            <button
              type="button"
              role="menuitem"
              className="menu-item rounded-[calc(var(--radius-ui)-2px)]"
              onClick={() => {
                close();
                openLoginModal();
              }}
            >
              Wallet &amp; assets
            </button>
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
