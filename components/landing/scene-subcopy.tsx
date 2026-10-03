import type { LandingScene } from '@/lib/landing/scenes';

type SceneSubcopyProps = {
  scene: LandingScene;
};

export function SceneSubcopy({ scene }: SceneSubcopyProps) {
  const hasCopy =
    scene.eyebrow ||
    scene.hint ||
    scene.hintSecondary ||
    (scene.steps && scene.steps.length > 0);

  if (!hasCopy) {
    return null;
  }

  const isHero = scene.id === 'hello';

  return (
    <div
      className={`xp-intro-copy${isHero ? ' xp-intro-copy--hero' : ' xp-intro-copy--steps'}`}
    >
      {scene.eyebrow ? (
        <p className="xp-subtitle-kicker">{scene.eyebrow}</p>
      ) : null}
      {scene.hint ? (
        <p
          className={
            isHero ? 'xp-subtitle-lead' : 'xp-subtitle-lead xp-subtitle-lead--steps'
          }
        >
          {scene.hint}
        </p>
      ) : null}
      {scene.hintSecondary ? (
        <p className="xp-subtitle-support">{scene.hintSecondary}</p>
      ) : null}
      {scene.steps ? (
        <ol className="xp-steps">
          {scene.steps.map((step) => (
            <li key={step.n}>
              <span>{step.n}</span>
              <div>
                <strong>{step.label}</strong>
                <p>{step.body}</p>
              </div>
            </li>
          ))}
        </ol>
      ) : null}
    </div>
  );
}
