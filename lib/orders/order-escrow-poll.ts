import { upeerAuthedFetch } from '@/lib/upeer-api';

type EscrowStatusPayload = {
  snapshot?: { approved?: boolean; released?: boolean } | null;
};

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function fetchEscrowMilestoneStatus(
  orderId: string,
  txHash?: string,
): Promise<EscrowStatusPayload> {
  const params = new URLSearchParams({ orderId });
  if (txHash) {
    params.set('txHash', txHash);
  }
  const res = await upeerAuthedFetch(`/api/escrow/status?${params}`);
  return (await res.json()) as EscrowStatusPayload;
}

export async function waitForEscrowMilestoneApproved(
  orderId: string,
  approveTxHash: string,
  onPoll?: (attempt: number) => void,
): Promise<void> {
  const maxAttempts = 25;
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    onPoll?.(attempt);
    const data = await fetchEscrowMilestoneStatus(orderId, approveTxHash);
    if (data.snapshot?.approved || data.snapshot?.released) {
      return;
    }
    await delay(Math.min(1500 + attempt * 250, 4000));
  }
  throw new Error(
    'Milestone approval is still confirming on Stellar. Wait a moment, then try Approve & Release again.',
  );
}
