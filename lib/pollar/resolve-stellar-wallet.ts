export type PollarWalletPayload = {
  publicKey?: string | null;
  address?: string | null;
  chain?: string | null;
  type?: string | null;
  custody?: string | null;
};

const STELLAR_ADDRESS = /^(G|C)[A-Z2-7]{55}$/;

export function isStellarAddress(value: string | null | undefined): boolean {
  return Boolean(value && STELLAR_ADDRESS.test(value));
}

function pickAddress(wallet: PollarWalletPayload | null | undefined): string | null {
  if (!wallet) {
    return null;
  }
  if (isStellarAddress(wallet.publicKey)) {
    return wallet.publicKey!;
  }
  if (isStellarAddress(wallet.address)) {
    return wallet.address!;
  }
  return null;
}

export function resolveStellarWalletFromVerify(
  wallet: PollarWalletPayload,
  wallets?: PollarWalletPayload[] | null,
): { publicKey: string; custody: 'internal' | 'external' | 'smart' } {
  const direct = pickAddress(wallet);
  if (direct) {
    return { publicKey: direct, custody: mapPollarCustody(wallet) };
  }

  const list = wallets ?? [];
  const stellarWallet =
    list.find((w) => w.chain === 'STELLAR') ??
    list.find((w) => pickAddress(w) !== null);

  const fromList = pickAddress(stellarWallet);
  if (fromList && stellarWallet) {
    return { publicKey: fromList, custody: mapPollarCustody(stellarWallet) };
  }

  throw new Error(
    'Pollar session has no Stellar wallet address yet. Wait for wallet creation to finish, then try again.',
  );
}

export function mapPollarCustody(
  wallet: PollarWalletPayload,
): 'internal' | 'external' | 'smart' {
  const raw = wallet.custody ?? wallet.type ?? 'internal';
  if (raw === 'smart') {
    return 'smart';
  }
  if (raw === 'external') {
    return 'external';
  }
  return 'internal';
}
