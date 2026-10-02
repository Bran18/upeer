'use client';

import { useEffect, useState, type RefObject } from 'react';

/** Pause WebGL when the canvas leaves the viewport. */
export function useInViewport(
  ref: RefObject<HTMLElement | null>,
  rootMargin = '160px',
  initial = false,
): boolean {
  const [visible, setVisible] = useState(initial);

  useEffect(() => {
    const node = ref.current;
    if (!node) {
      return;
    }
    const observer = new IntersectionObserver(
      ([entry]) => setVisible(entry.isIntersecting),
      { rootMargin, threshold: 0.05 },
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, [ref, rootMargin]);

  return visible;
}
