'use client';

import dynamic from 'next/dynamic';
import { useRef } from 'react';
import { ScrollReveal } from '@/components/ui/scroll-reveal';
import { useReducedMotion } from '@/hooks/use-reduced-motion';
import { useInViewport } from '@/hooks/use-in-viewport';

const FlowScene = dynamic(
  () => import('@/components/visual/flow-scene').then((m) => m.FlowScene),
  { ssr: false },
);

export function ImmersiveBand() {
  const reduceMotion = useReducedMotion();
  const wrapRef = useRef<HTMLElement>(null);
  const inView = useInViewport(wrapRef, '200px', false);
  const showCanvas = !reduceMotion && inView;

  return (
    <section
      ref={wrapRef}
      className="relative min-h-[70vh] overflow-hidden bg-[#02040a]"
      aria-labelledby="settlement-heading"
    >
      {showCanvas ? (
        <div className="absolute inset-0" aria-hidden="true">
          <FlowScene active={inView} />
        </div>
      ) : (
        <div
          className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(10,132,255,0.28),transparent_62%)]"
          aria-hidden="true"
        />
      )}
      <div
        className="pointer-events-none absolute inset-0 bg-gradient-to-b from-[#02040a]/20 via-transparent to-[#02040a]"
        aria-hidden="true"
      />
      <div className="relative z-10 flex min-h-[70vh] flex-col items-center justify-center px-6 text-center">
        <ScrollReveal>
          <p className="text-[0.6875rem] font-medium uppercase tracking-[0.32em] text-[#7ec8ff]">
            Settlement layer
          </p>
          <h2
            id="settlement-heading"
            className="mt-5 max-w-2xl text-balance text-[2rem] font-semibold tracking-tight text-white sm:text-[2.75rem]"
          >
            Liquidity in Motion
            <span className="mt-2 block text-[#64d2ff]">
              Escrow at the Center
            </span>
          </h2>
          <p className="mx-auto mt-5 max-w-md text-pretty text-[0.9375rem] leading-relaxed text-white/70">
            Quotes lock. Escrow deploys. Milestones release. One continuous
            flow on Stellar.
          </p>
        </ScrollReveal>
      </div>
    </section>
  );
}
