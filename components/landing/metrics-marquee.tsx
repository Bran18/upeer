'use client';

import { useId, useState } from 'react';
import { useReducedMotion } from '@/hooks/use-reduced-motion';

const METRICS = [
  { label: 'Network', value: 'Stellar testnet' },
  { label: 'Settlement', value: 'Trustless Work' },
  { label: 'Pricing', value: 'Reflector FX' },
  { label: 'Login', value: 'Pollar embedded' },
  { label: 'Swap rail', value: 'Soroswap' },
] as const;

export function MetricsMarquee() {
  const reduceMotion = useReducedMotion();
  const [paused, setPaused] = useState(false);
  const labelId = useId();
  const animate = !reduceMotion && !paused;
  const track = [...METRICS, ...METRICS];

  return (
    <section
      className="border-y border-[var(--line)] bg-[var(--background-secondary)] py-3.5"
      aria-labelledby={labelId}
    >
      <div className="mx-auto flex max-w-[1080px] items-center gap-3 px-6">
        <h2 id={labelId} className="sr-only">
          Platform stack
        </h2>
        <div className="marquee-mask min-w-0 flex-1 overflow-hidden">
          <ul
            className={`flex w-max gap-12 ${animate ? 'marquee-track' : ''}`}
          >
            {track.map((item, index) => (
              <li
                key={`${item.label}-${index}`}
                className="flex shrink-0 items-center gap-3 text-sm"
                aria-hidden={index >= METRICS.length || undefined}
              >
                <span className="text-caption uppercase tracking-[0.16em]">
                  {item.label}
                </span>
                <span
                  className="font-medium text-[var(--foreground)]"
                  translate="no"
                >
                  {item.value}
                </span>
                <span className="text-[var(--foreground-tertiary)]" aria-hidden>
                  ·
                </span>
              </li>
            ))}
          </ul>
        </div>
        {!reduceMotion ? (
          <button
            type="button"
            className="shrink-0 rounded-full px-3 py-1.5 text-xs font-medium text-[var(--foreground-secondary)] hover:bg-[var(--fill)] hover:text-[var(--foreground)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent)]"
            aria-pressed={paused}
            aria-label={paused ? 'Play stack marquee' : 'Pause stack marquee'}
            onClick={() => setPaused((value) => !value)}
          >
            {paused ? 'Play' : 'Pause'}
          </button>
        ) : null}
      </div>
    </section>
  );
}
