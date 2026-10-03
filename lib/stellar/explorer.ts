import type { StellarNetwork } from '@/lib/config/network';

const EXPLORER_BASE: Record<StellarNetwork, string> = {
  testnet: 'https://stellar.expert/explorer/testnet',
  mainnet: 'https://stellar.expert/explorer/public',
};

export function stellarExpertContractUrl(
  network: StellarNetwork,
  contractId: string,
): string {
  return `${EXPLORER_BASE[network]}/contract/${contractId}`;
}

export function stellarExpertTxUrl(
  network: StellarNetwork,
  txHash: string,
): string {
  return `${EXPLORER_BASE[network]}/tx/${txHash}`;
}

/** Read-only TW Escrow Viewer (V1 single-release), same surface as viewer.trustlesswork.com. */
export function trustlessWorkViewerUrl(
  network: StellarNetwork,
  contractId: string,
): string {
  const segment = network === 'testnet' ? 'testnet' : 'mainnet';
  return `https://viewer.trustlesswork.com/${segment}/v1/${contractId}`;
}
