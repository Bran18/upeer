export function getStellarNetworkClient(): 'testnet' | 'mainnet' {
  const env =
    process.env.NEXT_PUBLIC_STELLAR_NETWORK ??
    process.env.NEXT_PUBLIC_NETWORK;
  return env === 'mainnet' ? 'mainnet' : 'testnet';
}

const TESTNET_TOKENS = {
  xlmSac: 'CDLZFC3SYJYDZT7K67VZ75HPJVIEUVNIXF47ZG2FB2RMQQVU2HHGCYSC',
  usdcSac: 'CBBHRKEP5M3NUDRISGLJKGHDHX3DA2CN2AZBQY6WLVUJ7VNLGSKBDUCM',
  usdcIssuer: 'GBBD47IF6LWK7P7MDEVSCWR7DPUWV3NY3DTQEVFL4NAT4AQH3ZLLFLA5',
};

export function getNetworkConfigClient() {
  return TESTNET_TOKENS;
}
