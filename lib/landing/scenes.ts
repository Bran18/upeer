export const SECTION_HEIGHT = 50;
export const CAMERA_Z = 40;
export const CAMERA_FOV_START = 120;
export const CAMERA_FOV_END = 28;
export const CAMERA_TRAVEL_MS = 1400;

export type LandingScene = {
  id: string;
  lines: readonly [string] | readonly [string, string];
  align: 'left' | 'right' | 'center';
  eyebrow?: string;
  hint?: string;
  hintSecondary?: string;
  steps?: readonly { n: string; label: string; body: string }[];
  cta?: { href: string; label: string };
};

export const LANDING_SCENES: readonly LandingScene[] = [
  {
    id: 'hello',
    lines: ['UPEER'],
    align: 'left',
    eyebrow: 'USDC OTC on Stellar',
    hint: 'Trade desk-to-desk with verified merchants — not a pooled exchange.',
    hintSecondary:
      'Lock the quote, fund on-chain escrow, settle fiat with the desk.',
  },
  {
    id: 'market',
    lines: ['Market'],
    align: 'left',
  },
] as const;

export function sectionWorldY(index: number) {
  return -index * SECTION_HEIGHT;
}
