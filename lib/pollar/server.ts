import {
  isStellarAddress,
  mapPollarCustody,
  resolveStellarWalletFromVerify,
  type PollarWalletPayload,
} from '@/lib/pollar/resolve-stellar-wallet';

export type PollarVerifiedSession = {
  userId: string;
  applicationId: string;
  expiresAt: string;
  network: 'testnet' | 'mainnet';
  wallet: { publicKey: string; custody: 'internal' | 'external' | 'smart' };
  authProvider: string;
  profile?: { displayName?: string; email?: string };
};

type VerifyContent = {
  userId: string;
  applicationId: string;
  expiresAt: string;
  network: string;
  wallet: PollarWalletPayload;
  wallets?: PollarWalletPayload[] | null;
  authProvider: string;
  profile?: { displayName?: string; email?: string };
};

type VerifyApiResponse = {
  success: boolean;
  code?: string;
  content?: VerifyContent;
};

function pollarServerUrl(): string {
  return process.env.POLLAR_SERVER_URL ?? 'https://server.api.pollar.xyz';
}

function pollarSecretKey(): string {
  const key = process.env.POLLAR_SECRET_KEY;
  if (!key) {
    throw new Error('POLLAR_SECRET_KEY is not configured');
  }
  return key;
}

export async function verifyPollarAccessToken(
  token: string,
): Promise<PollarVerifiedSession> {
  const response = await fetch(`${pollarServerUrl()}/v1/tokens/verify`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-pollar-api-key': pollarSecretKey(),
    },
    body: JSON.stringify({ token }),
  });

  const envelope = (await response.json()) as VerifyApiResponse;
  if (!response.ok || !envelope.success || !envelope.content) {
    throw new Error(
      envelope.code ?? 'Pollar token verification failed',
    );
  }

  const body = envelope.content;
  let wallet: { publicKey: string; custody: 'internal' | 'external' | 'smart' };
  try {
    wallet = resolveStellarWalletFromVerify(body.wallet, body.wallets);
  } catch {
    wallet = {
      publicKey: '',
      custody: mapPollarCustody(body.wallet),
    };
  }

  return {
    userId: body.userId,
    applicationId: body.applicationId,
    expiresAt: body.expiresAt,
    network: body.network === 'mainnet' ? 'mainnet' : 'testnet',
    wallet,
    authProvider: body.authProvider,
    profile: body.profile,
  };
}

export function mergeStellarWalletHint(
  verified: PollarVerifiedSession,
  hint?: { stellarAddress?: string | null; custody?: string | null },
): PollarVerifiedSession {
  if (isStellarAddress(verified.wallet.publicKey)) {
    return verified;
  }
  if (!hint?.stellarAddress || !isStellarAddress(hint.stellarAddress)) {
    return verified;
  }
  const custody =
    hint.custody === 'smart' ||
    hint.custody === 'external' ||
    hint.custody === 'internal'
      ? hint.custody
      : verified.wallet.custody;

  return {
    ...verified,
    wallet: { publicKey: hint.stellarAddress, custody },
  };
}
