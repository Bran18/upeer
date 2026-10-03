'use client';

import dynamic from 'next/dynamic';
import { useEffect, useState } from 'react';
import { SceneSubcopy } from '@/components/landing/scene-subcopy';
import { NavLink } from '@/components/transition/nav-link';
import { useBreakpoint } from '@/hooks/use-breakpoint';
import { useReducedMotion } from '@/hooks/use-reduced-motion';
import { useScrollSections } from '@/hooks/use-scroll-sections';
import { LANDING_SCENES, type LandingScene } from '@/lib/landing/scenes';

const ExperienceScene = dynamic(
  () =>
    import('@/components/visual/experience-scene').then((m) => m.ExperienceScene),
  { ssr: false },
);

function ScenePanel({ scene }: { scene: LandingScene }) {
  return (
    <div
      className={`xp-copy-col${scene.steps ? ' xp-copy-col--steps' : ''}`}
    >
      <h1 className={`xp-words xp-words--${scene.align}`}>
        {scene.lines.map((line) => (
          <span key={line}>{line}</span>
        ))}
      </h1>
      <SceneSubcopy scene={scene} />
      {scene.cta ? (
        <NavLink href={scene.cta.href} className="xp-cta xp-cta--overlay">
          {scene.cta.label}
        </NavLink>
      ) : null}
    </div>
  );
}

export function LandingExperience() {
  const reduceMotion = useReducedMotion();
  const compact = !useBreakpoint('(min-width: 768px)');
  const [loaded, setLoaded] = useState(false);
  const [intro, setIntro] = useState(false);
  const [helpOpen, setHelpOpen] = useState(false);
  const [loadProgress, setLoadProgress] = useState(0);

  const observeSections = !reduceMotion && loaded && intro && !helpOpen;

  const { index, goTo, setSectionRef } = useScrollSections(
    LANDING_SCENES.length,
    observeSections,
  );

  useEffect(() => {
    if (!helpOpen) {
      return;
    }
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setHelpOpen(false);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [helpOpen]);

  useEffect(() => {
    if (reduceMotion) {
      return;
    }

    let frame = 0;
    const started = performance.now();
    const duration = 1100;

    const tick = (now: number) => {
      const t = Math.min(1, (now - started) / duration);
      setLoadProgress(Math.round(t * 100));
      if (t < 1) {
        frame = window.requestAnimationFrame(tick);
      } else {
        setLoaded(true);
        window.setTimeout(() => setIntro(true), 280);
      }
    };

    frame = window.requestAnimationFrame(tick);
    return () => window.cancelAnimationFrame(frame);
  }, [reduceMotion]);

  if (reduceMotion) {
    return (
      <div className="xp-reduced">
        <div className="xp-reduced-words">
          {LANDING_SCENES.map((item) => (
            <section key={item.id} className="xp-reduced-scene">
              <div className="experience-frame">
                {item.lines.map((line) => (
                  <p key={line}>{line}</p>
                ))}
                <SceneSubcopy scene={item} />
                {item.cta ? (
                  <NavLink href={item.cta.href} className="xp-cta">
                    {item.cta.label}
                  </NavLink>
                ) : null}
              </div>
            </section>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="xp-root">
      {!loaded ? (
        <div className="xp-loader" role="status" aria-live="polite">
          <p className="xp-loader-label">Loading…</p>
          <div className="xp-loader-track">
            <div
              className="xp-loader-bar"
              style={{ width: `${loadProgress}%` }}
            />
          </div>
        </div>
      ) : null}

      <div className="xp-canvas-shell" aria-hidden>
        <div className="xp-canvas">
          <ExperienceScene
            sectionIndex={index}
            active={loaded}
            intro={intro}
            compact={compact}
          />
        </div>
      </div>

      <div className="xp-scroll-track">
        {LANDING_SCENES.map((scene, i) => (
          <section
            key={scene.id}
            ref={setSectionRef(i)}
            className={`xp-scroll-section${scene.steps ? ' xp-scroll-section--steps' : ''}`}
            aria-label={scene.lines.join(' ')}
          >
            <div className="experience-frame">
              <ScenePanel scene={scene} />
            </div>
          </section>
        ))}
      </div>

      <nav className="xp-map" aria-label="Experience sections">
        {LANDING_SCENES.map((item, i) => (
          <button
            key={item.id}
            type="button"
            className={i === index ? 'is-active' : ''}
            aria-label={item.lines.join(' ')}
            aria-current={i === index ? 'true' : undefined}
            onClick={() => goTo(i)}
          />
        ))}
      </nav>

      <div className="xp-menu">
        <button
          type="button"
          className="xp-menu-button"
          onClick={() => setHelpOpen(true)}
        >
          Help
        </button>
      </div>

      {helpOpen ? (
        <div className="xp-help" role="dialog" aria-modal="true" aria-labelledby="xp-help-title">
          <div className="experience-frame xp-help-inner">
            <h2 id="xp-help-title">How to move</h2>
            <p>Scroll through each full-screen section — the scene moves with you.</p>
            <p>Use the dots on the right to jump between sections.</p>
            <button type="button" className="xp-cta" onClick={() => setHelpOpen(false)}>
              Close
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
