import {
  parseEscrowBalanceOnly,
  parseEscrowOnChainSnapshot,
  type EscrowOnChainSnapshot,
} from '@/lib/escrow/on-chain';
import {
  fetchEscrowContractEvents,
  snapshotFromContractEvents,
} from '@/lib/escrow/contract-events';
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
  validateOnChain: boolean,
): Promise<EscrowOnChainSnapshot | null> {
  try {
    const payload = await twGetEscrowByContractIds(
      [contractId],
      validateOnChain,
    );
    return parseEscrowOnChainSnapshot(payload, expectedAmount, contractId);
  } catch {
    return null;
  }
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

function mergeSnapshots(
  primary: EscrowOnChainSnapshot | null,
  secondary: EscrowOnChainSnapshot | null,
): EscrowOnChainSnapshot | null {
  if (!primary) {
    return secondary;
  }
  if (!secondary) {
    return primary;
  }
  const released = primary.released || secondary.released;
  const disputed = primary.disputed || secondary.disputed;
  const approved = Boolean(primary.approved || secondary.approved);
  const fundCount = Math.max(
    primary.fundCount ?? 0,
    secondary.fundCount ?? 0,
  );
  const amount = Math.max(primary.amount, secondary.amount);
  const balance = released ? 0 : Math.max(primary.balance, secondary.balance);
  const funded =
    released ||
    primary.funded ||
    secondary.funded ||
    (amount > 0 ? balance >= amount * 0.999 : balance > 0);
  return {
    balance,
    amount,
    funded,
    released,
    disputed,
    approved,
    fundCount: fundCount || undefined,
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
  let eventsSnapshot: EscrowOnChainSnapshot | null = null;
  try {
    const events = await fetchEscrowContractEvents(
      contractId,
      options.expectedAmount,
    );
    eventsSnapshot = snapshotFromContractEvents(events, options.expectedAmount);
  } catch {
    eventsSnapshot = null;
  }

  let snapshot: EscrowOnChainSnapshot | null =
    await loadFromIndexerByContractId(
      contractId,
      options.expectedAmount,
      false,
    );

  const needsOnChainCheck =
    !eventsSnapshot?.funded &&
    (!snapshot || (!snapshot.funded && snapshot.balance === 0));
  const syncHash = options.syncTxHash?.trim();

  if (!snapshot && syncHash) {
    try {
      await twUpdateFromTxHash(syncHash);
    } catch {
      // indexer sync is best-effort
    }
    snapshot =
      (await loadFromIndexerByContractId(
        contractId,
        options.expectedAmount,
        true,
      )) ?? snapshot;
  } else if (needsOnChainCheck) {
    snapshot =
      (await loadFromIndexerByContractId(
        contractId,
        options.expectedAmount,
        true,
      )) ?? snapshot;
  }

  if (!snapshot && !eventsSnapshot && options.sellerSigner) {
    try {
      const bySigner = await twGetEscrowsBySigner(options.sellerSigner, false);
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

  snapshot = mergeSnapshots(eventsSnapshot, snapshot);

  const chainBalance = await readChainBalance(contractId);
  if (chainBalance == null) {
    return snapshot;
  }
  return mergeSnapshots(snapshot, {
    balance: chainBalance,
    amount: snapshot?.amount ?? options.expectedAmount,
    funded:
      Boolean(snapshot?.released) ||
      (options.expectedAmount > 0
        ? chainBalance >= options.expectedAmount * 0.999
        : chainBalance > 0),
    released: snapshot?.released ?? false,
    disputed: snapshot?.disputed ?? false,
    approved: snapshot?.approved,
    fundCount: snapshot?.fundCount,
  });
}
