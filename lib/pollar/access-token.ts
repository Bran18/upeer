import type { PollarClient } from '@pollar/core';

export function readPollarAccessToken(client: PollarClient): string | null {
  const auth = client.getAuthState();
  if (auth.step !== 'authenticated') {
    return null;
  }
  return auth.session.token.accessToken;
}

export type PollarWalletHint = {
  stellarAddress?: string;
  custody?: 'internal' | 'external' | 'smart';
};

export function readPollarWalletHint(client: PollarClient): PollarWalletHint {
  const wallet = client.getWallet();
  if (!wallet?.address) {
    return {};
  }
  return {
    stellarAddress: wallet.address,
    custody: wallet.custody,
  };
}
