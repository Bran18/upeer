import {
  parseEscrowBalanceOnly,
  parseEscrowOnChainSnapshot,
  type EscrowOnChainSnapshot,
} from '@/lib/escrow/on-chain';
import {
  pickEscrowContractByEngagement,
  twGetEscrowByContractIds,
  twGetEscrowsBySigner,
  twGetMultipleEscrowBalance,
  twUpdateFromTxHash,
} from '@/lib/trustless-work/client';

async function loadFromIndexerByContractId(
  contractId: string,
  expectedAmount: number,
): Promise<EscrowOnChainSnapshot | null> {
  for (const validateOnChain of [false, true]) {
    try {
      const payload = await twGetEscrowByContractIds(
        [contractId],
        validateOnChain,
      );
      const snapshot = parseEscrowOnChainSnapshot(
        payload,
        expectedAmount,
        contractId,
      );
      if (snapshot) {
        return snapshot;
      }
    } catch {
      // try validateOnChain=true
    }
  }
  return null;
}

async function readChainBalance(
  contractId: string,
): Promise<number | null> {
  try {
    const balancePayload = await twGetMultipleEscrowBalance([contractId]);
    return parseEscrowBalanceOnly(balancePayload, contractId);
  } catch {
    return null;
  }
}

function mergeChainBalance(
  snapshot: EscrowOnChainSnapshot | null,
  chainBalance: number | null,
  expectedAmount: number,
): EscrowOnChainSnapshot | null {
  if (chainBalance == null) {
    return snapshot;
  }
  const amount = snapshot?.amount ?? expectedAmount;
  const released = snapshot?.released ?? false;
  const disputed = snapshot?.disputed ?? false;
  const funded =
    released || (amount > 0 ? chainBalance >= amount * 0.999 : chainBalance > 0);
  return {
    balance: chainBalance,
    amount,
    funded,
    released,
    disputed,
  };
}

export async function fetchEscrowOnChainSnapshot(
  contractId: string,
  options: {
    expectedAmount: number;
    engagementId: string;
    sellerSigner?: string | null;
    /** Triggers `/indexer/update-from-txHash` when indexer has no row yet. */
    syncTxHash?: string | null;
  },
): Promise<EscrowOnChainSnapshot | null> {
  let snapshot: EscrowOnChainSnapshot | null =
    await loadFromIndexerByContractId(contractId, options.expectedAmount);

  const syncHash = options.syncTxHash?.trim();
  if (!snapshot && syncHash) {
    try {
      await twUpdateFromTxHash(syncHash);
    } catch {
      // indexer sync is best-effort
    }
    snapshot = await loadFromIndexerByContractId(contractId, options.expectedAmount);
  }

  if (!snapshot && options.sellerSigner) {
    try {
      const bySigner = await twGetEscrowsBySigner(options.sellerSigner, true);
      const matchedId = pickEscrowContractByEngagement(
        bySigner,
        options.engagementId,
      );
      if (matchedId) {
        const payload = await twGetEscrowByContractIds([matchedId], true);
        snapshot = parseEscrowOnChainSnapshot(
          payload,
          options.expectedAmount,
          matchedId,
        );
      }
    } catch {
      // fall through to balance helper
    }
  }

  const chainBalance = await readChainBalance(contractId);
  return mergeChainBalance(snapshot, chainBalance, options.expectedAmount);
}
