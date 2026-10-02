-- Post-Pollar onboarding: platform role intent

alter table public.profiles
  add column if not exists platform_intent text
    check (platform_intent is null or platform_intent in ('buyer', 'merchant', 'both')),
  add column if not exists onboarding_completed_at timestamptz;

comment on column public.profiles.platform_intent is
  'How the user intends to participate on UPEER (set during onboarding).';
comment on column public.profiles.onboarding_completed_at is
  'When the user finished role selection; null means onboarding required.';
