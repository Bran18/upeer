'use client';

import Link from 'next/link';
import { Avatar } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import type { MeProfile } from '@/lib/profile/types';
import {
  primaryCtaForIntent,
  type SetupItem,
} from '@/lib/dashboard/setup-progress';
import { roleLabel } from '@/lib/nav/user-links';
import { cn } from '@/lib/cn';

type DashboardHeroProps = {
  profile: MeProfile;
  progress: { completed: number; total: number; percent: number };
  nextItem: SetupItem | null;
};

export function DashboardHero({ profile, progress, nextItem }: DashboardHeroProps) {
  const intent = profile.platformIntent!;
  const name = profile.displayName?.trim() || 'there';
  const primary = primaryCtaForIntent(intent);
  const role = roleLabel(intent);

  return (
    <section
      className="ui-card overflow-hidden"
      aria-labelledby="dashboard-greeting"
    >
      <div className="relative border-b border-[var(--line)] bg-[radial-gradient(ellipse_80%_120%_at_100%_0%,var(--accent-muted),transparent_55%)] px-5 py-6 sm:px-6 sm:py-7">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex min-w-0 items-start gap-3">
            <Avatar label={profile.displayName ?? profile.stellarAddress} size="md" />
            <div className="min-w-0">
              <p className="text-xs font-medium uppercase tracking-[0.16em] text-[var(--foreground-tertiary)]">
                Welcome back
              </p>
              <h1
                id="dashboard-greeting"
                className="mt-1 text-2xl font-semibold tracking-tight text-balance sm:text-3xl"
              >
                {name}
              </h1>
              <div className="mt-2 flex flex-wrap items-center gap-2">
                {role ? <Badge variant="accent">{role}</Badge> : null}
                <Badge variant="muted">Testnet</Badge>
              </div>
            </div>
          </div>
          <div className="flex shrink-0 flex-wrap gap-2">
            <Link href={primary.href} className="btn-primary">
              {primary.label}
            </Link>
            <Link href="#settings" className="btn-secondary">
              Edit profile
            </Link>
          </div>
        </div>

        <div className="mt-6">
          <div className="flex items-center justify-between gap-3 text-sm">
            <span className="text-[var(--foreground-secondary)]">Account setup</span>
            <span className="font-medium tabular-nums">
              {progress.completed} of {progress.total} complete
            </span>
          </div>
          <div
            className="mt-2 h-2 overflow-hidden rounded-full bg-[var(--fill)]"
            role="progressbar"
            aria-valuenow={progress.percent}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-label="Account setup progress"
          >
            <div
              className={cn(
                'h-full rounded-full bg-[var(--accent)] transition-[width] duration-500',
              )}
              style={{ width: `${progress.percent}%` }}
            />
          </div>
          {nextItem ? (
            <p className="mt-3 text-sm text-[var(--foreground-secondary)] text-pretty">
              <span className="text-[var(--foreground)]">Next:</span>{' '}
              {nextItem.title}
              {nextItem.href ? (
                <>
                  {' — '}
                  <Link
                    href={nextItem.href}
                    className="font-medium text-[var(--accent)] hover:text-[var(--accent-hover)]"
                  >
                    {nextItem.hrefLabel ?? 'Continue'}
                  </Link>
                </>
              ) : null}
            </p>
          ) : null}
        </div>
      </div>
      <p className="px-5 py-3 text-sm text-[var(--foreground-secondary)] sm:px-6">
        {primary.description}
      </p>
    </section>
  );
}
