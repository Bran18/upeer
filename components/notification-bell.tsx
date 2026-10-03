'use client';

import Link from 'next/link';
import { useCallback, useEffect, useId, useRef, useState } from 'react';
import { usePollar } from '@pollar/react';
import { useDismissible } from '@/hooks/use-dismissible';
import { upeerAuthedFetch } from '@/lib/upeer-api';
import { cn } from '@/lib/cn';

type Notification = {
  id: string;
  title: string;
  body: string;
  href: string | null;
  read_at: string | null;
  created_at: string;
};

export function NotificationBell({ overlay = false }: { overlay?: boolean }) {
  const { isAuthenticated } = usePollar();
  const panelId = useId();
  const panelRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<Notification[]>([]);
  const [unread, setUnread] = useState(0);

  const close = useCallback(() => setOpen(false), []);
  useDismissible(open, close, [panelRef, triggerRef]);

  const refresh = useCallback(async () => {
    if (!isAuthenticated) {
      return;
    }
    try {
      const res = await upeerAuthedFetch('/api/notifications');
      const data = await res.json();
      if (res.ok) {
        setItems(data.notifications ?? []);
        setUnread(data.unreadCount ?? 0);
      }
    } catch {
      /* ignore */
    }
  }, [isAuthenticated]);

  useEffect(() => {
    void refresh();
    const t = window.setInterval(() => void refresh(), 30_000);
    return () => window.clearInterval(t);
  }, [refresh]);

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="relative">
      <button
        ref={triggerRef}
        type="button"
        aria-label="Notifications"
        aria-expanded={open}
        aria-controls={panelId}
        className={cn(
          'relative inline-flex h-9 w-9 items-center justify-center rounded-full border text-sm',
          overlay
            ? 'border-white/20 text-white'
            : 'border-[var(--line)] text-[var(--foreground-secondary)]',
        )}
        onClick={() => {
          setOpen((v) => !v);
          void refresh();
        }}
      >
        <span aria-hidden>🔔</span>
        {unread > 0 ? (
          <span
            className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-[var(--accent)] px-1 text-[10px] font-semibold text-[var(--accent-ink)]"
          >
            {unread > 9 ? '9+' : unread}
          </span>
        ) : null}
      </button>

      {open ? (
        <div
          ref={panelRef}
          id={panelId}
          role="menu"
          className="absolute right-0 z-50 mt-2 w-[min(20rem,calc(100vw-2rem))] rounded-[var(--radius-ui)] border border-[var(--line)] bg-[var(--surface-elevated)] p-2 shadow-lg"
        >
          <div className="flex items-center justify-between px-2 py-1">
            <p className="text-sm font-medium">Notifications</p>
            {unread > 0 ? (
              <button
                type="button"
                className="text-xs text-[var(--accent)]"
                onClick={() =>
                  void upeerAuthedFetch('/api/notifications/read-all', {
                    method: 'POST',
                  }).then(() => refresh())
                }
              >
                Mark all read
              </button>
            ) : null}
          </div>
          <ul className="max-h-72 overflow-y-auto">
            {items.length === 0 ? (
              <li className="px-2 py-4 text-center text-sm text-[var(--foreground-tertiary)]">
                No notifications yet
              </li>
            ) : (
              items.map((n) => (
                <li key={n.id}>
                  <Link
                    href={n.href ?? '/orders'}
                    className="block rounded-md px-2 py-2 hover:bg-[var(--fill)]"
                    onClick={() => {
                      void upeerAuthedFetch(`/api/notifications/${n.id}/read`, {
                        method: 'PATCH',
                      });
                      close();
                    }}
                  >
                    <p className="text-sm font-medium">{n.title}</p>
                    <p className="text-xs text-[var(--foreground-secondary)]">
                      {n.body}
                    </p>
                  </Link>
                </li>
              ))
            )}
          </ul>
        </div>
      ) : null}
    </div>
  );
}
