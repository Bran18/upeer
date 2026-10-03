alter table public.escrow_sessions
  add column if not exists last_tx_hash text;
