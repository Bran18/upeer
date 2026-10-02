'use client';

import { useEffect, useState } from 'react';

/** `true` when the media query matches (default: viewport ≥ 640px). */
export function useBreakpoint(query = '(min-width: 640px)') {
  const [matches, setMatches] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia(query);
    const update = () => setMatches(mq.matches);
    update();
    mq.addEventListener('change', update);
    return () => mq.removeEventListener('change', update);
  }, [query]);

  return matches;
}
