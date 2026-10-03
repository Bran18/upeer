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
    id: 'steps',
    lines: ['P2P', 'IN A FEW STEPS'],
    align: 'left',
    hint: 'Three moves. No mystery wallet in the middle.',
    steps: [
      {
        n: '01',
        label: 'Quote',
        body: 'Reflector prices the leg. Your spread is fixed before anyone sends USDC.',
      },
      {
        n: '02',
        label: 'Escrow',
        body: 'USDC waits in Trustless Work until the milestone is approved.',
      },
      {
        n: '03',
        label: 'Settle',
        body: 'You pay fiat with the desk. On-chain proof is not a bank transfer.',
      },
    ],
    cta: { href: '/market', label: 'Browse the market' },
  },
] as const;

export function sectionWorldY(index: number) {
  return -index * SECTION_HEIGHT;
}
