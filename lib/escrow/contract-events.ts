import { rpc, scValToNative, xdr } from '@stellar/stellar-sdk';
import type { EscrowOnChainSnapshot } from '@/lib/escrow/on-chain';
import { getStellarRpc } from '@/lib/stellar/rpc';

/** V1 single-release topics from `single-release-main` `contracts/escrow/src/events/handler.rs`. */
export const TW_EVENT = {
  init: 'tw_init',
  fund: 'tw_fund',
  release: 'tw_release',
  approve: 'tw_ms_approve',
  milestoneChange: 'tw_ms_change',
  dispute: 'tw_dispute',
  disputeResolve: 'tw_disp_resolve',
  update: 'tw_update',
} as const;

const LEDGER_CHUNK = 8_000;
const PAGE_LIMIT = 100;
const USDC_STROOPS = 10_000_000;

export type EscrowContractEvent = {
  kind: string;
  ledger: number;
  txHash: string;
  amountUsdc: number | null;
};

export function eventKindFromTopics(topics: unknown[]): string | null {
  for (const topic of topics) {
    const native = asNative(topic);
    if (typeof native === 'string' && native.trim() !== '') {
      return native.trim();
    }
  }
  return null;
}

export function toUsdcAmount(raw: unknown, expectedUsdc: number): number | null {
  const n = asFiniteNumber(raw);
  if (n == null) {
    return null;
  }
  if (expectedUsdc > 0 && n > expectedUsdc * 100) {
    return n / USDC_STROOPS;
  }
  if (n >= 1_000_000) {
    return n / USDC_STROOPS;
  }
  return n;
}

export function snapshotFromContractEvents(
  events: EscrowContractEvent[],
  expectedAmount: number,
): EscrowOnChainSnapshot | null {
  if (events.length === 0) {
    return null;
  }

  const kinds = new Set(events.map((event) => event.kind));
  const initialized = kinds.has(TW_EVENT.init);
  const fundEvents = events.filter((event) => event.kind === TW_EVENT.fund);
  const released = kinds.has(TW_EVENT.release);
  const disputed =
    kinds.has(TW_EVENT.dispute) && !kinds.has(TW_EVENT.disputeResolve);
  const approved = kinds.has(TW_EVENT.approve);

  const initAmount = events.find((event) => event.kind === TW_EVENT.init)
    ?.amountUsdc;
  const amount =
    initAmount != null && initAmount > 0 ? initAmount : expectedAmount;

  const deposited = fundEvents.reduce(
    (sum, event) => sum + (event.amountUsdc ?? 0),
    0,
  );
  const balance = released ? 0 : deposited;
  const funded =
    released ||
    fundEvents.length > 0 ||
    (amount > 0 ? deposited >= amount * 0.999 : deposited > 0);

  if (!initialized && !funded && !released && !disputed) {
    return null;
  }

  return {
    balance,
    amount,
    funded,
    released,
    disputed,
    approved,
    fundCount: fundEvents.length,
  };
}

export async function fetchEscrowContractEvents(
  contractId: string,
  expectedAmount: number,
): Promise<EscrowContractEvent[]> {
  const server = getStellarRpc();
  const health = await server.getHealth();
  const latest = health.latestLedger;
  const oldest = health.oldestLedger + 1;
  const collected: EscrowContractEvent[] = [];

  let end = latest;
  while (end >= oldest) {
    const start = Math.max(oldest, end - LEDGER_CHUNK + 1);
    const chunk = await readEventChunk(
      server,
      contractId,
      start,
      end,
      expectedAmount,
    );
    collected.push(...chunk);
    if (
      collected.some((event) => event.kind === TW_EVENT.fund) ||
      collected.some((event) => event.kind === TW_EVENT.release)
    ) {
      break;
    }
    if (start <= oldest) {
      break;
    }
    end = start - 1;
  }

  collected.sort((a, b) => a.ledger - b.ledger);
  return collected;
}

async function readEventChunk(
  server: rpc.Server,
  contractId: string,
  startLedger: number,
  endLedger: number,
  expectedAmount: number,
): Promise<EscrowContractEvent[]> {
  const filters = [
    {
      type: 'contract' as const,
      contractIds: [contractId],
    },
  ];
  const out: EscrowContractEvent[] = [];
  let cursor: string | undefined;

  for (let page = 0; page < 20; page += 1) {
    const response = cursor
      ? await server.getEvents({
          filters,
          cursor,
          limit: PAGE_LIMIT,
        })
      : await server.getEvents({
          filters,
          startLedger,
          endLedger,
          limit: PAGE_LIMIT,
        });

    for (const event of response.events) {
      if (event.ledger < startLedger || event.ledger > endLedger) {
        continue;
      }
      const parsed = parseRpcEvent(event, expectedAmount);
      if (parsed) {
        out.push(parsed);
      }
    }

    if (response.events.length < PAGE_LIMIT || !response.cursor) {
      break;
    }
    cursor = response.cursor;
  }

  return out;
}

function parseRpcEvent(
  event: rpc.Api.EventResponse,
  expectedAmount: number,
): EscrowContractEvent | null {
  const kind = eventKindFromTopics(event.topic ?? []);
  if (!kind) {
    return null;
  }
  return {
    kind,
    ledger: event.ledger,
    txHash: event.txHash,
    amountUsdc: amountFromEvent(kind, event.value, expectedAmount),
  };
}

function amountFromEvent(
  kind: string,
  value: xdr.ScVal,
  expectedAmount: number,
): number | null {
  const native = asNative(value);
  if (kind === TW_EVENT.fund) {
    if (Array.isArray(native) && native.length >= 2) {
      return toUsdcAmount(native[1], expectedAmount);
    }
    return toUsdcAmount(native, expectedAmount);
  }
  if (kind === TW_EVENT.init) {
    const row = Array.isArray(native) ? native[0] : native;
    if (row && typeof row === 'object') {
      return toUsdcAmount(
        (row as { amount?: unknown }).amount,
        expectedAmount,
      );
    }
  }
  return null;
}

function asNative(value: unknown): unknown {
  if (
    typeof value === 'string' ||
    typeof value === 'number' ||
    typeof value === 'bigint' ||
    value == null
  ) {
    return value;
  }
  try {
    return scValToNative(value as xdr.ScVal);
  } catch {
    return value;
  }
}

function asFiniteNumber(value: unknown): number | null {
  if (typeof value === 'bigint') {
    return Number(value);
  }
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value;
  }
  if (typeof value === 'string' && value.trim() !== '') {
    const n = Number(value);
    return Number.isFinite(n) ? n : null;
  }
  return null;
}
