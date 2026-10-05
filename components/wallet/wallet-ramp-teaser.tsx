'use client';

import Link from 'next/link';

/**
 * Licensed PIX on/off-ramp via LATAM Ramp Kit — separate from P2P desks.
 * Full widget integration requires @ramp-kit packages and server-side API keys.
 */
export function WalletRampTeaser() {
  const enabled = process.env.NEXT_PUBLIC_ENABLE_RAMP_KIT === 'true';
  if (!enabled) {
    return null;
  }

  return (
    <section className="ui-card space-y-3 px-5 py-5 sm:px-6">
      <h2 className="text-sm font-medium text-[var(--foreground)]">
        Buy with PIX (provider)
      </h2>
      <p className="text-sm text-[var(--foreground-secondary)] text-pretty">
        Fund your wallet with BRL via a licensed ramp (Etherfuse / Manteca). This
        is not a P2P trade — it delivers USDC to your Pollar wallet. Install{' '}
        <code className="text-xs">@ramp-kit/core</code> and{' '}
        <code className="text-xs">@ramp-kit/server</code>, then wire{' '}
        <code className="text-xs">ETHERFUSE_API_KEY</code> on the server.
      </p>
      <p className="text-xs text-[var(--foreground-tertiary)]">
        Reference:{' '}
        <Link
          href="https://github.com/armandocodecr/latam-ramp-kit"
          className="text-[var(--accent)] hover:underline"
          target="_blank"
          rel="noopener noreferrer"
        >
          latam-ramp-kit
        </Link>
      </p>
    </section>
  );
}
