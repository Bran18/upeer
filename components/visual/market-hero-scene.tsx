'use client';

import dynamic from 'next/dynamic';
import { useEffect, useRef, useState } from 'react';
import { useBreakpoint } from '@/hooks/use-breakpoint';
import { useInViewport } from '@/hooks/use-in-viewport';
import { useReducedMotion } from '@/hooks/use-reduced-motion';
import type { ExchangeSide } from '@/lib/exchange/match';

const ExchangeSwapScene = dynamic(
  () =>
    import('@/components/visual/exchange-swap-scene').then(
      (module) => module.ExchangeSwapScene,
    ),
  { ssr: false },
);

function StaticHero() {
  return (
    <div className="market-hero-static" aria-hidden>
      <span className="exchange-stage-static-orbit exchange-stage-static-orbit--outer" />
      <span className="exchange-stage-static-orbit exchange-stage-static-orbit--mid" />
      <span className="exchange-stage-static-core" />
    </div>
  );
}

export function MarketHeroScene() {
  const reduceMotion = useReducedMotion();
  const compact = !useBreakpoint('(min-width: 1024px)');
  const stageRef = useRef<HTMLDivElement>(null);
  const inView = useInViewport(stageRef, '80px', true);
  const [side, setSide] = useState<ExchangeSide>('buy');

  useEffect(() => {
    if (reduceMotion) {
      return;
    }
    const timer = window.setInterval(() => {
      setSide((current) => (current === 'buy' ? 'sell' : 'buy'));
    }, 9000);
    return () => window.clearInterval(timer);
  }, [reduceMotion]);

  return (
    <div ref={stageRef} className="market-hero-scene" aria-hidden>
      {reduceMotion ? (
        <StaticHero />
      ) : (
        <ExchangeSwapScene side={side} active={inView} compact={compact} />
      )}
    </div>
  );
}
