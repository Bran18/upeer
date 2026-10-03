export type EscrowOnChainSnapshot = {
  balance: number;
  amount: number;
  funded: boolean;
  released: boolean;
  disputed: boolean;
};

function readNumber(value: unknown): number | null {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value;
  }
  if (typeof value === 'string' && value.trim() !== '') {
    const n = Number(value);
    return Number.isFinite(n) ? n : null;
  }
  return null;
}

function asRecord(value: unknown): Record<string, unknown> | null {
  return value && typeof value === 'object' && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null;
}

function escrowList(payload: unknown): Record<string, unknown>[] {
  if (!payload) {
    return [];
  }
  if (Array.isArray(payload)) {
    return payload.filter(
      (row): row is Record<string, unknown> => asRecord(row) !== null,
    );
  }
  const record = asRecord(payload);
  if (!record) {
    return [];
  }
  const list = record.escrows ?? record.data ?? record.result;
  if (Array.isArray(list)) {
    return list.filter(
      (row): row is Record<string, unknown> => asRecord(row) !== null,
    );
  }
  return [record];
}

export function pickEscrowRowByContractId(
  payload: unknown,
  contractId: string,
): Record<string, unknown> | null {
  const normalized = contractId.trim();
  const keyed = asRecord(payload);
  if (keyed?.[normalized]) {
    return asRecord(keyed[normalized]);
  }

  for (const row of escrowList(payload)) {
    const id =
      row.contractId ?? row.contract_id ?? row.address ?? row.escrowContractId;
    if (typeof id === 'string' && id === normalized) {
      return row;
    }
  }

  const rows = escrowList(payload);
  return rows[0] ?? null;
}

function amountFromMilestones(row: Record<string, unknown>): number | null {
  const milestones = row.milestones;
  if (!Array.isArray(milestones) || milestones.length === 0) {
    return null;
  }
  let total = 0;
  for (const milestone of milestones) {
    const record = asRecord(milestone);
    const value = record ? readNumber(record.amount) : null;
    if (value == null) {
      return null;
    }
    total += value;
  }
  return total;
}

export function parseEscrowOnChainSnapshot(
  payload: unknown,
  expectedAmount?: number,
  contractId?: string,
): EscrowOnChainSnapshot | null {
  const row = contractId
    ? pickEscrowRowByContractId(payload, contractId)
    : escrowList(payload)[0] ?? null;
  if (!row) {
    return null;
  }

  const nested = asRecord(row.escrow);

  const balance =
    readNumber(row.balance) ??
    readNumber(nested?.balance) ??
    readNumber(row.currentBalance) ??
    0;

  const amount =
    readNumber(row.amount) ??
    readNumber(row.escrowAmount) ??
    readNumber(nested?.amount) ??
    amountFromMilestones(row) ??
    (expectedAmount != null ? expectedAmount : 0);

  const flags =
    asRecord(row.flags) ??
    asRecord(nested?.flags) ??
    {};
  const released = Boolean(
    row.released ?? flags.released ?? flags.isReleased,
  );
  const disputed = Boolean(
    row.disputed ?? flags.disputed ?? flags.isDisputed,
  );

  return {
    balance,
    amount,
    funded:
      released ||
      (amount > 0 ? balance >= amount * 0.999 : balance > 0),
    released,
    disputed,
  };
}

export function parseEscrowBalanceOnly(
  payload: unknown,
  contractId: string,
): number | null {
  if (!payload) {
    return null;
  }
  const normalized = contractId.trim();
  const keyed = asRecord(payload);
  const keyedRow = keyed?.[normalized];
  if (keyedRow) {
    const direct = readNumber(keyedRow);
    if (direct != null) {
      return direct;
    }
    const nested = asRecord(keyedRow);
    if (nested) {
      return readNumber(nested.balance);
    }
  }

  const rows = Array.isArray(payload) ? payload : escrowList(payload);
  for (const row of rows) {
    const record = asRecord(row);
    if (!record) {
      continue;
    }
    const address =
      record.address ?? record.contractId ?? record.contract_id ?? record.id;
    if (typeof address === 'string' && address === normalized) {
      const balance = readNumber(record.balance);
      if (balance != null) {
        return balance;
      }
    }
  }

  if (rows.length === 1) {
    const only = asRecord(rows[0]);
    return only ? readNumber(only.balance) : null;
  }
  return null;
}
