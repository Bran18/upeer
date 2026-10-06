const STAGES = [
  { id: 'prepare', label: 'Prepare' },
  { id: 'sign', label: 'Sign' },
  { id: 'confirm', label: 'Confirm' },
  { id: 'finish', label: 'Finish' },
] as const;

type StageId = (typeof STAGES)[number]['id'];

type Props = {
  headline: string;
  detail: string;
  walletHint?: boolean;
};

function progressStage(detail: string, walletHint: boolean): StageId {
  if (walletHint) {
    return 'sign';
  }
  const text = detail.toLowerCase();
  if (
    text.includes('stellar') ||
    text.includes('confirming') ||
    text.includes('confirm approval')
  ) {
    return 'confirm';
  }
  if (
    text.includes('recording') ||
    text.includes('updating') ||
    text.includes('finishing')
  ) {
    return 'finish';
  }
  return 'prepare';
}

export function WalletActionProgress({
  headline,
  detail,
  walletHint = false,
}: Props) {
  const stage = progressStage(detail, walletHint);
  const stageIndex = STAGES.findIndex((item) => item.id === stage);

  return (
    <div
      className="tx-progress"
      role="status"
      aria-live="polite"
      aria-busy="true"
    >
      <div
        className={
          walletHint ? 'tx-progress-mark tx-progress-mark--sign' : 'tx-progress-mark'
        }
        aria-hidden
      >
        <span className="tx-progress-ring" />
        <span className="tx-progress-ring" />
        <span className="tx-progress-ring" />
        <span className="tx-progress-core" />
      </div>

      <div className="tx-progress-copy">
        <p className="tx-progress-headline">{headline}</p>
        <p className="tx-progress-detail">{detail}</p>
        <p className="tx-progress-hint">
          {walletHint
            ? 'Approve the Pollar prompt. Stay on this page until it finishes.'
            : 'Keep this tab open. Do not refresh until the step completes.'}
        </p>
      </div>

      <ol className="tx-progress-stages" aria-label="Transaction progress">
        {STAGES.map((item, index) => {
          const state =
            index < stageIndex ? 'done' : index === stageIndex ? 'now' : 'wait';
          return (
            <li
              key={item.id}
              className={`tx-progress-stage tx-progress-stage--${state}`}
              aria-current={state === 'now' ? 'step' : undefined}
            >
              <span className="tx-progress-stage-bar" />
              <span className="tx-progress-stage-label">{item.label}</span>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
