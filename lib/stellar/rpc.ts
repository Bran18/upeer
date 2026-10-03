import { rpc } from '@stellar/stellar-sdk';
import { getStellarNetwork } from '@/lib/config/network';

/** App chain RPC — not the Reflector oracle override. */
export function getStellarRpc(): rpc.Server {
  const network = getStellarNetwork();
  const rpcUrl =
    network === 'mainnet'
      ? (process.env.STELLAR_MAINNET_RPC_URL?.trim() ?? '')
      : 'https://soroban-testnet.stellar.org';
  if (!rpcUrl) {
    throw new Error('STELLAR_MAINNET_RPC_URL is required for mainnet');
  }
  return new rpc.Server(rpcUrl, { allowHttp: rpcUrl.startsWith('http://') });
}
