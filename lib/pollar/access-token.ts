import type { PollarClient } from '@pollar/core';

export function readPollarAccessToken(client: PollarClient): string | null {
  const auth = client.getAuthState();
  if (auth.step !== 'authenticated') {
    return null;
  }
  return auth.session.token.accessToken;
}
