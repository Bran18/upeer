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
