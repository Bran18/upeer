'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

export function useScrollSections(count: number, observe: boolean) {
  const [index, setIndex] = useState(0);
  const indexRef = useRef(0);
  const sectionRefs = useRef<(HTMLElement | null)[]>([]);

  const setSectionRef = useCallback(
    (i: number) => (node: HTMLElement | null) => {
      sectionRefs.current[i] = node;
    },
    [],
  );

  const goTo = useCallback((next: number) => {
    if (next < 0 || next >= count) {
      return;
    }
    sectionRefs.current[next]?.scrollIntoView({
      behavior: 'smooth',
      block: 'start',
    });
  }, [count]);

  useEffect(() => {
    if (!observe) {
      return;
    }

    const nodes = sectionRefs.current.filter(
      (node): node is HTMLElement => node != null,
    );
    if (nodes.length === 0) {
      return;
    }

    const ratios = new Map<number, number>();

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          const i = nodes.indexOf(entry.target as HTMLElement);
          if (i < 0) {
            continue;
          }
          ratios.set(i, entry.intersectionRatio);
        }

        let bestIndex = -1;
        let bestRatio = 0;
        for (const [i, ratio] of ratios) {
          if (ratio > bestRatio) {
            bestRatio = ratio;
            bestIndex = i;
          }
        }

        if (bestIndex >= 0 && bestRatio >= 0.2 && bestIndex !== indexRef.current) {
          indexRef.current = bestIndex;
          setIndex(bestIndex);
        }
      },
      {
        threshold: [0.2, 0.35, 0.5, 0.65, 0.8],
        rootMargin: '-18% 0px -28% 0px',
      },
    );

    for (const node of nodes) {
      observer.observe(node);
    }

    return () => observer.disconnect();
  }, [observe, count]);

  return { index, goTo, setSectionRef, sectionRefs };
}
