import { getNetworkConfig } from '@/lib/config/network';

export type TwUnsignedResponse = {
  unsignedTransaction?: string;
  xdr?: string;
  status?: string;
  message?: string;
};

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
  const data = (await res.json()) as TwUnsignedResponse & { message?: string };
  if (!res.ok) {
    throw new Error(data.message ?? `Approve failed (${res.status})`);
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
  const data = (await res.json()) as TwUnsignedResponse & { message?: string };
  if (!res.ok) {
    throw new Error(data.message ?? `Release failed (${res.status})`);
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

export function extractUnsignedXdr(
  response: TwUnsignedResponse,
): string | null {
  return response.unsignedTransaction ?? response.xdr ?? null;
}
