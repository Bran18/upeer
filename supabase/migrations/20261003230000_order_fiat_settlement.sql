alter table public.orders
  add column if not exists fiat_settlement jsonb;

comment on column public.orders.fiat_settlement is
  'Snapshot of USDC seller fiat payout method at lock time: profileId, selectedAt, method';
