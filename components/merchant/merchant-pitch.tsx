import { MERCHANT_PITCH_STEPS } from '@/lib/merchant/copy';

export function MerchantPitch() {
  return (
    <section aria-labelledby="merchant-how-heading">
      <h2 id="merchant-how-heading" className="text-sm font-medium">
        How a desk works
      </h2>
      <ol className="mt-4 grid gap-3 sm:grid-cols-3">
        {MERCHANT_PITCH_STEPS.map((step, index) => (
          <li
            key={step.title}
            className="ui-card flex min-h-[8.5rem] flex-col justify-between p-5"
          >
            <p className="exchange-kicker">{String(index + 1).padStart(2, '0')}</p>
            <div>
              <p className="mt-4 text-sm font-medium">{step.title}</p>
              <p className="mt-2 text-sm leading-relaxed text-[var(--foreground-secondary)] text-pretty">
                {step.body}
              </p>
            </div>
          </li>
        ))}
      </ol>
    </section>
  );
}
