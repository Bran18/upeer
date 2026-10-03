alter table public.profiles
  add column if not exists payment_prefs jsonb not null default '{"methods":[]}'::jsonb;

comment on column public.profiles.payment_prefs is
  'P2P fiat payment methods: { primaryMethodId?, methods: [{ id, rail, currency, label, instructions }] }';
