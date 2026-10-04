'use client';

import { NavLink } from '@/components/transition/nav-link';

function ArrowIcon() {
  return (
    <svg
      aria-hidden
      className="h-4 w-4 shrink-0"
      viewBox="0 0 16 16"
      fill="none"
    >
      <path
        d="M3 8h10M9 4l4 4-4 4"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function LandingHeroActions() {
  return (
    <div className="market-hero-actions">
      <NavLink
        href="/market"
        direction="forward"
        className="btn-primary market-hero-cta-primary gap-2"
      >
        View open offers
        <ArrowIcon />
      </NavLink>
    </div>
  );
}
