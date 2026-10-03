'use client';

type ActionId = 'receive' | 'send' | 'swap' | 'history';

type Props = {
  onReceive: () => void;
  onSend: () => void;
  onSwap: () => void;
  onHistory: () => void;
  active?: ActionId | null;
};

const ACTIONS: {
  id: ActionId;
  label: string;
  hint: string;
}[] = [
  { id: 'receive', label: 'Receive', hint: 'Show deposit address' },
  { id: 'send', label: 'Send', hint: 'Pay a Stellar account' },
  { id: 'swap', label: 'Swap', hint: 'Convert assets' },
  { id: 'history', label: 'History', hint: 'Open past activity' },
];

function ActionGlyph({ id }: { id: ActionId }) {
  const common = {
    viewBox: '0 0 24 24',
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth: 1.6,
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
    'aria-hidden': true,
  };

  if (id === 'receive') {
    return (
      <svg {...common}>
        <path d="M12 3v12" />
        <path d="M7 11l5 5 5-5" />
        <path d="M5 20h14" />
      </svg>
    );
  }
  if (id === 'send') {
    return (
      <svg {...common}>
        <path d="M12 21V9" />
        <path d="M7 13l5-5 5 5" />
        <path d="M5 4h14" />
      </svg>
    );
  }
  if (id === 'swap') {
    return (
      <svg {...common}>
        <path d="M7 7h11l-3-3" />
        <path d="M17 17H6l3 3" />
      </svg>
    );
  }
  return (
    <svg {...common}>
      <path d="M5 6h14" />
      <path d="M5 12h14" />
      <path d="M5 18h9" />
    </svg>
  );
}

export function WalletQuickActions({
  onReceive,
  onSend,
  onSwap,
  onHistory,
  active = null,
}: Props) {
  const handlers: Record<ActionId, () => void> = {
    receive: onReceive,
    send: onSend,
    swap: onSwap,
    history: onHistory,
  };

  return (
    <div className="wallet-dock" role="group" aria-label="Wallet shortcuts">
      {ACTIONS.map((action) => {
        const isActive = active === action.id;
        return (
          <button
            key={action.id}
            type="button"
            className={isActive ? 'wallet-dock-item wallet-dock-item--active' : 'wallet-dock-item'}
            onClick={handlers[action.id]}
            aria-label={action.hint}
            aria-pressed={isActive}
          >
            <span className="wallet-dock-glyph">
              <ActionGlyph id={action.id} />
            </span>
            <span className="wallet-dock-label">{action.label}</span>
          </button>
        );
      })}
    </div>
  );
}
