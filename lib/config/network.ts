import { Networks } from '@stellar/stellar-sdk';
import { resolveStellarNetwork } from '@/lib/config/env';

/** Mainnet Pulse deployments (read-only oracle may use PUBLIC passphrase on custom RPC). */
const MAINNET_PULSE_CONTRACT_IDS = new Set([
  'CALI2BYU2JE6WVRUFYTS6MSBNEHGJ35P4AVCZYF3B6QOE3QKOB2PLE6M',
  'CAFJZQWSED6YAWZU3GWRTOCNPPCGBN32L7QV43XX5LZLFTK6JLN34DLN',
  'CBKGPWGKSKZF52CFHMTRR23TBWTPMRDIYZ4O2P5VS65BMHYH4DXMCJZC',
]);

export type StellarNetwork = 'testnet' | 'mainnet';

export type NetworkConfig = {
  network: StellarNetwork;
  rpcUrl: string;
  horizonUrl: string;
  networkPassphrase: string;
  usdcIssuer: string;
  usdcSac: string;
  reflectorFxContractId: string;
  trustlessWorkBaseUrl: string;
  soroswapNetwork: 'testnet' | 'mainnet';
};

const TESTNET: NetworkConfig = {
  network: 'testnet',
  rpcUrl: 'https://soroban-testnet.stellar.org',
  horizonUrl: 'https://horizon-testnet.stellar.org',
  networkPassphrase: Networks.TESTNET,
  usdcIssuer: 'GBBD47IF6LWK7P7MDEVSCWR7DPUWV3NY3DTQEVFL4NAT4AQH3ZLLFLA5',
  usdcSac: 'CBBHRKEP5M3NUDRISGLJKGHDHX3DA2CN2AZBQY6WLVUJ7VNLGSKBDUCM',
  reflectorFxContractId:
    'CCSSOHTBL3LEWUCBBEB5NJFC2OKFRC74OWEIJIZLRJBGAAU4VMU5NV4W',
  trustlessWorkBaseUrl: 'https://dev.api.trustlesswork.com',
  soroswapNetwork: 'testnet',
};

const MAINNET: NetworkConfig = {
  network: 'mainnet',
  rpcUrl: process.env.STELLAR_MAINNET_RPC_URL ?? '',
  horizonUrl: 'https://horizon.stellar.org',
  networkPassphrase: Networks.PUBLIC,
  usdcIssuer: 'GA5ZSEJYB37JRC5AVCIA5MOP4RHTM335X2KGX3IHOJAPP5RE34K4KZVN',
  usdcSac: '',
  reflectorFxContractId:
    'CBKGPWGKSKZF52CFHMTRR23TBWTPMRDIYZ4O2P5VS65BMHYH4DXMCJZC',
  trustlessWorkBaseUrl: 'https://api.trustlesswork.com',
  soroswapNetwork: 'mainnet',
};

export function getStellarNetwork(): StellarNetwork {
  return resolveStellarNetwork();
}

export function getReflectorPulseContractId(): string {
  const override = process.env.REFLECTOR_PULSE_CONTRACT_ID?.trim();
  if (override) {
    return override;
  }
  return getNetworkConfig().reflectorFxContractId;
}

export function getReflectorPulseConfig(): {
  contractId: string;
  rpcUrl: string;
  networkPassphrase: string;
  feedHint: 'fx' | 'dex_or_cex' | 'unknown';
} {
  const appNetwork = getNetworkConfig();
  const contractId = getReflectorPulseContractId();
  const rpcUrl =
    process.env.REFLECTOR_RPC_URL?.trim() ?? appNetwork.rpcUrl;

  const isMainnetOracle = MAINNET_PULSE_CONTRACT_IDS.has(contractId);
  const networkPassphrase = isMainnetOracle
    ? Networks.PUBLIC
    : appNetwork.networkPassphrase;

  let feedHint: 'fx' | 'dex_or_cex' | 'unknown' = 'unknown';
  if (
    contractId === appNetwork.reflectorFxContractId ||
    contractId ===
      'CCSSOHTBL3LEWUCBBEB5NJFC2OKFRC74OWEIJIZLRJBGAAU4VMU5NV4W' ||
    contractId ===
      'CBKGPWGKSKZF52CFHMTRR23TBWTPMRDIYZ4O2P5VS65BMHYH4DXMCJZC'
  ) {
    feedHint = 'fx';
  } else if (
    contractId.startsWith('CA') ||
    contractId.startsWith('CB') ||
    contractId.startsWith('CC')
  ) {
    feedHint = 'dex_or_cex';
  }

  return { contractId, rpcUrl, networkPassphrase, feedHint };
}

export function getNetworkConfig(): NetworkConfig {
  const network = getStellarNetwork();
  if (network === 'mainnet') {
    if (!process.env.STELLAR_MAINNET_RPC_URL) {
      throw new Error('STELLAR_MAINNET_RPC_URL is required for mainnet');
    }
    const config = { ...MAINNET };
    if (process.env.REFLECTOR_RPC_URL) {
      config.rpcUrl = process.env.REFLECTOR_RPC_URL;
    }
    return config;
  }
  const config = { ...TESTNET };
  if (process.env.REFLECTOR_RPC_URL) {
    config.rpcUrl = process.env.REFLECTOR_RPC_URL;
  }
  return config;
}

export const REFLECTOR_PULSE_DEFAULT_RESOLUTION_SECONDS = 300;

export const DEFAULT_LATAM_SYMBOLS = [
  'CRC',
  'ARS',
  'BOB',
  'CLP',
  'COP',
] as const;
