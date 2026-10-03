-- P2P maker-accept flow, profile-owned offers, notifications

alter table public.profiles
  add column if not exists payout_address text,
  add column if not exists is_operator boolean not null default false;

comment on column public.profiles.payout_address is
  'Stellar G address for escrow roles when this profile posts orders';
comment on column public.profiles.is_operator is
  'Platform operator — access to /admin';

alter table public.offers
  add column if not exists maker_profile_id uuid references public.profiles (id) on delete restrict;

update public.offers o
set maker_profile_id = m.profile_id
from public.merchants m
where o.merchant_id = m.id
  and o.maker_profile_id is null;

alter table public.offers
  alter column merchant_id drop not null;

alter table public.orders
  add column if not exists maker_profile_id uuid references public.profiles (id) on delete restrict,
  add column if not exists taker_profile_id uuid references public.profiles (id) on delete restrict,
  add column if not exists fiat_confirmation jsonb not null default '{}'::jsonb;

alter table public.orders drop constraint if exists orders_status_check;

alter table public.orders
  add constraint orders_status_check check (
    status in (
      'pending_acceptance',
      'declined',
      'created',
      'reserved',
      'escrow_pending',
      'fiat_pending',
      'released',
      'cancelled',
      'disputed'
    )
  );

alter table public.escrow_sessions
  add column if not exists last_error text;

create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references public.profiles (id) on delete cascade,
  type text not null,
  title text not null,
  body text not null,
  href text,
  read_at timestamptz,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists notifications_profile_unread_idx
  on public.notifications (profile_id, created_at desc)
  where read_at is null;

create index if not exists notifications_profile_created_idx
  on public.notifications (profile_id, created_at desc);

alter table public.notifications enable row level security;

create index if not exists offers_maker_profile_id_idx on public.offers (maker_profile_id);
create index if not exists orders_maker_profile_id_idx on public.orders (maker_profile_id);
create index if not exists orders_taker_profile_id_idx on public.orders (taker_profile_id);
