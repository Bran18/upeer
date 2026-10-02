'use client';

import type { ReactNode } from 'react';
import { useRef } from 'react';
import { useReducedMotion } from '@/hooks/use-reduced-motion';

type TiltCardProps = {
  children: ReactNode;
  className?: string;
  intensity?: number;
};

export function TiltCard({
  children,
  className = '',
  intensity = 7,
}: TiltCardProps) {
  const ref = useRef<HTMLDivElement>(null);
  const reduceMotion = useReducedMotion();

  function onMove(event: React.MouseEvent<HTMLDivElement>) {
    if (reduceMotion) {
      return;
    }
    const el = ref.current;
    if (!el) {
      return;
    }
    const rect = el.getBoundingClientRect();
    const x = (event.clientX - rect.left) / rect.width - 0.5;
    const y = (event.clientY - rect.top) / rect.height - 0.5;
    el.style.transform = `perspective(1100px) rotateY(${x * intensity}deg) rotateX(${-y * intensity}deg)`;
  }

  function onLeave() {
    const el = ref.current;
    if (!el) {
      return;
    }
    el.style.transform = 'perspective(1100px) rotateY(0deg) rotateX(0deg)';
  }

  return (
    <div
      ref={ref}
      onMouseMove={onMove}
      onMouseLeave={onLeave}
      className={`tilt-card ${className}`}
    >
      {children}
    </div>
  );
}
