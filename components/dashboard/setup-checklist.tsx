'use client';

import Link from 'next/link';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import type { SetupItem } from '@/lib/dashboard/setup-progress';
import { cn } from '@/lib/cn';

function statusBadge(status: SetupItem['status']) {
  switch (status) {
    case 'done':
      return { label: 'Complete', variant: 'success' as const };
    case 'upcoming':
      return { label: 'Upcoming', variant: 'muted' as const };
    default:
      return { label: 'To do', variant: 'accent' as const };
  }
}

export function SetupChecklist({ items }: { items: SetupItem[] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Your checklist</CardTitle>
        <CardDescription>
          Finish these steps to get the most out of upeer. Upcoming items will unlock
          as integrations go live.
        </CardDescription>
      </CardHeader>
      <CardContent className="pt-0">
        <ol className="space-y-0">
          {items.map((item, index) => {
            const badge = statusBadge(item.status);
            return (
              <li
                key={item.id}
                className={cn(
                  'grid gap-3 border-t border-[var(--line)] py-4 sm:grid-cols-[auto_1fr_auto] sm:items-center',
                  index === 0 && 'border-t-0 pt-0',
                )}
              >
                <span
                  className={cn(
                    'flex h-8 w-8 items-center justify-center rounded-full text-xs font-semibold tabular-nums',
                    item.status === 'done'
                      ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300'
                      : 'bg-[var(--fill)] text-[var(--foreground-secondary)]',
                  )}
                  aria-hidden="true"
                >
                  {String(index + 1).padStart(2, '0')}
                </span>
                <div className="min-w-0">
                  <p className="font-medium text-[var(--foreground)]">{item.title}</p>
                  <p className="mt-1 text-sm leading-relaxed text-[var(--foreground-secondary)] text-pretty">
                    {item.description}
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-2 sm:justify-end">
                  <Badge variant={badge.variant}>{badge.label}</Badge>
                  {item.href && item.hrefLabel && item.status !== 'upcoming' ? (
                    <Link
                      href={item.href}
                      className="text-sm font-medium text-[var(--accent)] hover:text-[var(--accent-hover)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent)]"
                    >
                      {item.hrefLabel}
                    </Link>
                  ) : null}
                </div>
              </li>
            );
          })}
        </ol>
      </CardContent>
    </Card>
  );
}
