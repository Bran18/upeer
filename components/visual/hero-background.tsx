'use client';

import dynamic from 'next/dynamic';
import { useReducedMotion } from '@/hooks/use-reduced-motion';

const HeroScene = dynamic(
  () => import('@/components/visual/hero-scene').then((m) => m.HeroScene),
  { ssr: false },
);

export function HeroVisual() {
  const reduceMotion = useReducedMotion();

  if (reduceMotion) {
    return (
      <div
        className="flex h-full min-h-[280px] items-center justify-center"
        aria-hidden
      >
        <div className="hero-static-orb h-52 w-52 rounded-full" />
      </div>
    );
  }

  return (
    <div
      className="pointer-events-none relative h-full min-h-[320px] w-full sm:min-h-[420px] lg:min-h-[520px]"
      aria-hidden
    >
      <div className="hero-canvas-glow absolute left-1/2 top-1/2 h-[min(90%,420px)] w-[min(90%,420px)] -translate-x-1/2 -translate-y-1/2 rounded-full" />
      <div className="relative z-[1] h-full w-full">
        <HeroScene />
      </div>
    </div>
  );
}
