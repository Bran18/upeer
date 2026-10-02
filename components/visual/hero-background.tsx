'use client';

import dynamic from 'next/dynamic';
import { useBreakpoint } from '@/hooks/use-breakpoint';
import { useReducedMotion } from '@/hooks/use-reduced-motion';

const HeroScene = dynamic(
  () => import('@/components/visual/hero-scene').then((m) => m.HeroScene),
  { ssr: false },
);

export function HeroVisual({ fill = false }: { fill?: boolean }) {
  const reduceMotion = useReducedMotion();
  const isDesktop = useBreakpoint('(min-width: 640px)');
  const compact = fill && !isDesktop;

  const frame = fill
    ? 'relative h-full w-full min-h-[280px]'
    : 'relative h-full min-h-[280px] w-full sm:min-h-[420px] lg:min-h-[520px]';

  if (reduceMotion) {
    return (
      <div className={`flex items-center justify-center ${frame}`} aria-hidden>
        <div
          className={`hero-static-orb rounded-full ${
            fill
              ? 'h-44 w-44 sm:h-72 sm:w-72'
              : 'h-52 w-52 sm:h-72 sm:w-72'
          }`}
        />
      </div>
    );
  }

  return (
    <div className={`pointer-events-none ${frame}`} aria-hidden>
      <div
        className={`hero-canvas-glow absolute -translate-x-1/2 -translate-y-1/2 rounded-full ${
          fill
            ? 'hero-canvas-glow--landing left-1/2 top-[72%] h-[min(70vw,360px)] w-[min(70vw,360px)] sm:left-[62%] sm:top-1/2 sm:h-[min(80%,520px)] sm:w-[min(80%,520px)]'
            : 'left-1/2 top-1/2 h-[min(90%,420px)] w-[min(90%,420px)]'
        }`}
      />
      <div className="relative z-[1] h-full min-h-[inherit] w-full">
        <HeroScene compact={compact} />
      </div>
    </div>
  );
}
