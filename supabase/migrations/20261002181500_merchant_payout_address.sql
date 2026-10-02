alter table public.merchants
  add column if not exists payout_address text;

comment on column public.merchants.payout_address is
  'Stellar G address for escrow receiver/serviceProvider roles';
