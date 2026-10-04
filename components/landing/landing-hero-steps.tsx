const STEPS = [
  {
    title: 'Pick a desk',
    detail: 'Live USDC prices in CRC, ARS, and more.',
  },
  {
    title: 'Take a quote',
    detail: 'Your size locks at the posted rate.',
  },
  {
    title: 'Settle together',
    detail: 'USDC in escrow; fiat moves P2P.',
  },
] as const;

export function LandingHeroSteps() {
  return (
    <ol className="market-hero-steps">
      {STEPS.map((step, index) => (
        <li key={step.title} className="market-hero-step">
          <span className="market-hero-step-num" aria-hidden>
            {index + 1}
          </span>
          <div className="min-w-0">
            <p className="market-hero-step-title">{step.title}</p>
            <p className="market-hero-step-detail">{step.detail}</p>
          </div>
        </li>
      ))}
    </ol>
  );
}
