'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';

export function CopyWalletButton({ address }: { address: string }) {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(address);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  }

  return (
    <Button
      type="button"
      variant="secondary"
      size="sm"
      aria-live="polite"
      onClick={() => void handleCopy()}
    >
      {copied ? 'Copied' : 'Copy address'}
    </Button>
  );
}
