import { getNetworkConfig } from '@/lib/config/network';

export type TwUnsignedResponse = {
  unsignedTransaction?: string;
  unsignedXdr?: string;
  xdr?: string;
  contractId?: string;
  escrowContractId?: string;
  status?: string;
  message?: string;
  error?: string;
  title?: string;
  detail?: string;
};

function twErrorMessage(
  data: TwUnsignedResponse,
  fallback: string,
): string {
  return data.message ?? data.error ?? data.detail ?? data.title ?? fallback;
}

const SOROBAN_CONTRACT_ID = /^C[A-Z0-9]{55}$/;

export function extractDeployContractId(
  response: Record<string, unknown>,
): string | null {
  const nested = response.data;
  if (nested && typeof nested === 'object' && !Array.isArray(nested)) {
    const fromNested = extractDeployContractId(
      nested as Record<string, unknown>,
    );
    if (fromNested) {
      return fromNested;
    }
  }

  const candidates = [
    response.contractId,
    response.escrowContractId,
    response.contract_id,
    response.escrowContractAddress,
    response.address,
  ];
  for (const value of candidates) {
    if (typeof value === 'string' && SOROBAN_CONTRACT_ID.test(value)) {
      return value;
    }
  }

  for (const value of Object.values(response)) {
    if (typeof value === 'string' && SOROBAN_CONTRACT_ID.test(value)) {
      return value;
    }
  }
  return null;
}

function apiKey(): string {
  const key = process.env.TRUSTLESS_WORK_API_KEY;
  if (!key) {
    throw new Error('TRUSTLESS_WORK_API_KEY is not configured');
  }
  return key;
}

function baseUrl(): string {
  return getNetworkConfig().trustlessWorkBaseUrl;
}

async function twFetch(
  path: string,
  init?: RequestInit,
): Promise<Response> {
  const headers = new Headers(init?.headers);
  headers.set('x-api-key', apiKey());
  if (!headers.has('Content-Type') && init?.body) {
    headers.set('Content-Type', 'application/json');
  }
  return fetch(`${baseUrl()}${path}`, { ...init, headers });
}

export async function probeTrustlessWork(): Promise<{
  baseUrl: string;
  docsReachable: boolean;
  apiKeyConfigured: boolean;
  apiKeyStatus: 'missing' | 'invalid' | 'accepted' | 'unchecked';
  probeHttpStatus?: number;
  message?: string;
}> {
  const url = baseUrl();
  let docsReachable = false;
  try {
    const docs = await fetch(`${url}/docs`, { method: 'GET' });
    docsReachable = docs.ok;
  } catch {
    docsReachable = false;
  }

  if (!process.env.TRUSTLESS_WORK_API_KEY) {
    return {
      baseUrl: url,
      docsReachable,
      apiKeyConfigured: false,
      apiKeyStatus: 'missing',
      message: 'Set TRUSTLESS_WORK_API_KEY in the server environment.',
    };
  }

  try {
    const res = await twFetch(
      '/escrow/single-release/get-escrow?validateOnChain=false',
    );
    const apiKeyStatus =
      res.status === 401 || res.status === 403 ? 'invalid' : 'accepted';
    return {
      baseUrl: url,
      docsReachable,
      apiKeyConfigured: true,
      apiKeyStatus,
      probeHttpStatus: res.status,
      message:
        apiKeyStatus === 'accepted'
          ? 'API key accepted (escrow probe returned a non-auth error).'
          : 'API key rejected by Trustless Work.',
    };
  } catch (error) {
    return {
      baseUrl: url,
      docsReachable,
      apiKeyConfigured: true,
      apiKeyStatus: 'unchecked',
      message:
        error instanceof Error ? error.message : 'Trustless Work probe failed',
    };
  }
}

export async function twDeploySingleRelease(
  body: Record<string, unknown>,
): Promise<TwUnsignedResponse> {
  const res = await twFetch('/deployer/single-release', {
    method: 'POST',
    body: JSON.stringify(body),
  });
  const data = (await res.json()) as TwUnsignedResponse & { message?: string };
  if (!res.ok) {
    throw new Error(data.message ?? `Deploy failed (${res.status})`);
  }
  return data;
}

export async function twFundEscrow(
  body: Record<string, unknown>,
): Promise<TwUnsignedResponse> {
  const res = await twFetch('/escrow/single-release/fund-escrow', {
    method: 'POST',
    body: JSON.stringify(body),
  });
  const data = (await res.json()) as TwUnsignedResponse & { message?: string };
  if (!res.ok) {
    throw new Error(data.message ?? `Fund failed (${res.status})`);
  }
  return data;
}

export async function twApproveMilestone(
  body: Record<string, unknown>,
): Promise<TwUnsignedResponse> {
  const res = await twFetch('/escrow/single-release/approve-milestone', {
    method: 'POST',
    body: JSON.stringify(body),
  });
  const data = (await res.json()) as TwUnsignedResponse;
  if (!res.ok) {
    throw new Error(twErrorMessage(data, `Approve failed (${res.status})`));
  }
  return data;
}

export async function twReleaseFunds(
  body: Record<string, unknown>,
): Promise<TwUnsignedResponse> {
  const res = await twFetch('/escrow/single-release/release-funds', {
    method: 'POST',
    body: JSON.stringify(body),
  });
  const data = (await res.json()) as TwUnsignedResponse;
  if (!res.ok) {
    throw new Error(twErrorMessage(data, `Release failed (${res.status})`));
  }
  return data;
}

export async function twSendTransaction(signedXdr: string): Promise<unknown> {
  const res = await twFetch('/helper/send-transaction', {
    method: 'POST',
    body: JSON.stringify({ signedXdr }),
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(
      (data as { message?: string }).message ??
        `Send transaction failed (${res.status})`,
    );
  }
  return data;
}

export function extractSendTransactionContractId(
  response: unknown,
): string | null {
  if (!response || typeof response !== 'object') {
    return null;
  }
  return extractDeployContractId(response as Record<string, unknown>);
}

function appendQueryList(
  query: URLSearchParams,
  key: string,
  values: string[],
): void {
  for (const value of values) {
    query.append(key, value);
  }
}

/**
 * Same endpoint as SDK `useGetEscrowFromIndexerByContractIds` →
 * `getEscrowByContractIds({ contractIds, validateOnChain? })`.
 */
export async function twGetEscrowByContractIds(
  contractIds: string[],
  validateOnChain = true,
): Promise<unknown> {
  if (contractIds.length === 0) {
    return [];
  }
  const query = new URLSearchParams();
  appendQueryList(query, 'contractIds', contractIds);
  query.set('validateOnChain', String(validateOnChain));
  const res = await twFetch(`/helper/get-escrow-by-contract-ids?${query}`);
  const data = await res.json();
  if (!res.ok) {
    throw new Error(
      (data as { message?: string }).message ??
        `Escrow status failed (${res.status})`,
    );
  }
  return data;
}

/** Sync indexer from a ledger tx (SDK: `updateFromTxHash`). */
export async function twUpdateFromTxHash(txHash: string): Promise<unknown> {
  const attempts = [
    { path: '/indexer/update-from-txhash', method: 'PUT' },
    { path: '/indexer/update-from-txHash', method: 'POST' },
  ] as const;

  let lastMessage = 'Indexer update failed';
  for (const attempt of attempts) {
    const res = await twFetch(attempt.path, {
      method: attempt.method,
      body: JSON.stringify({ txHash }),
    });
    const data = (await res.json().catch(() => ({}))) as { message?: string };
    if (res.ok) {
      return data;
    }
    lastMessage = data.message ?? `Indexer update failed (${res.status})`;
  }
  throw new Error(lastMessage);
}

export async function twGetMultipleEscrowBalance(
  addresses: string[],
): Promise<unknown> {
  if (addresses.length === 0) {
    return [];
  }
  const query = new URLSearchParams();
  appendQueryList(query, 'addresses', addresses);
  const res = await twFetch(`/helper/get-multiple-escrow-balance?${query}`);
  const data = await res.json();
  if (!res.ok) {
    throw new Error(
      (data as { message?: string }).message ??
        `Escrow balance failed (${res.status})`,
    );
  }
  return data;
}

export async function twGetEscrowsBySigner(
  signer: string,
  validateOnChain = true,
): Promise<unknown> {
  const query = new URLSearchParams({
    signer,
    validateOnChain: String(validateOnChain),
  });
  const res = await twFetch(`/helper/get-escrows-by-signer?${query}`);
  const data = await res.json();
  if (!res.ok) {
    throw new Error(
      (data as { message?: string }).message ??
        `Escrow lookup failed (${res.status})`,
    );
  }
  return data;
}

export function pickEscrowContractByEngagement(
  payload: unknown,
  engagementId: string,
): string | null {
  const list = Array.isArray(payload)
    ? payload
    : payload && typeof payload === 'object'
      ? ((payload as Record<string, unknown>).escrows ??
        (payload as Record<string, unknown>).data ??
        [])
      : [];
  if (!Array.isArray(list)) {
    return null;
  }
  for (const row of list) {
    if (!row || typeof row !== 'object') {
      continue;
    }
    const record = row as Record<string, unknown>;
    const eid = record.engagementId ?? record.engagement_id;
    const cid =
      record.contractId ?? record.contract_id ?? record.escrowContractId;
    if (
      eid === engagementId &&
      typeof cid === 'string' &&
      SOROBAN_CONTRACT_ID.test(cid)
    ) {
      return cid;
    }
  }
  return null;
}

export function extractUnsignedXdr(
  response: TwUnsignedResponse,
): string | null {
  return (
    response.unsignedTransaction ??
    response.unsignedXdr ??
    response.xdr ??
    null
  );
}
