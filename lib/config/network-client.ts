export function getStellarNetworkClient(): 'testnet' | 'mainnet' {
  const env =
    process.env.NEXT_PUBLIC_STELLAR_NETWORK ??
    process.env.NEXT_PUBLIC_NETWORK;
  return env === 'mainnet' ? 'mainnet' : 'testnet';
}
