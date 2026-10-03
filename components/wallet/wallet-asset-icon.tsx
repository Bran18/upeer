type Props = {
  code: string;
  className?: string;
};

const TONES: Record<string, string> = {
  XLM: 'wallet-asset-icon--xlm',
  USDC: 'wallet-asset-icon--usdc',
};

export function WalletAssetIcon({ code, className = '' }: Props) {
  const tone = TONES[code] ?? 'wallet-asset-icon--default';
  const letter = code.slice(0, 1).toUpperCase();

  return (
    <span
      className={`wallet-asset-icon ${tone}${className ? ` ${className}` : ''}`}
      aria-hidden="true"
    >
      {letter}
    </span>
  );
}
