'use client';

import dynamic from 'next/dynamic';
import { useReducedMotion } from '@/hooks/use-reduced-motion';

const HeroScene = dynamic(
  () => import('@/components/visual/hero-scene').then((m) => m.HeroScene),
  { ssr: false },
);

export function HeroBackground() {
  const reduceMotion = useReducedMotion();

  return (
    <div
      className="pointer-events-none absolute inset-0 -z-10 overflow-hidden"
      aria-hidden
    >
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_60%_at_50%_-10%,rgba(52,211,153,0.18),transparent_55%),radial-gradient(ellipse_60%_50%_at_90%_20%,rgba(139,92,246,0.12),transparent_50%),linear-gradient(to_bottom,#030303_0%,#050508_45%,#030303_100%)]" />
      <div className="hero-grid absolute inset-0 opacity-[0.35]" />
      {!reduceMotion ? (
        <div className="absolute inset-0 opacity-90 mix-blend-screen">
          <HeroScene />
        </div>
      ) : null}
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-[#030303]/20 to-[#030303]" />
    </div>
  );
}
