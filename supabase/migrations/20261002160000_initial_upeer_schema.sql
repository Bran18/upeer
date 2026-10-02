-- UPEER initial schema (mirrors remote migration initial_upeer_schema)

create extension if not exists pgcrypto;

create table public.profiles (
  id uuid primary key default gen_random_uuid(),
  pollar_user_id text not null unique,
  pollar_application_id text not null,
  stellar_address text not null,
  custody text not null check (custody in ('internal', 'external', 'smart')),
  network text not null check (network in ('testnet', 'mainnet')),
  display_name text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (network, stellar_address)
);

create table public.merchants (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null unique references public.profiles (id) on delete restrict,
  status text not null default 'pending'
    check (status in ('pending', 'approved', 'rejected', 'suspended')),
  display_name text not null,
  metadata jsonb not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index merchants_status_idx on public.merchants (status);

create table public.offers (
  id uuid primary key default gen_random_uuid(),
  merchant_id uuid not null references public.merchants (id) on delete restrict,
  side text not null check (side in ('sell_usdc', 'buy_usdc')),
  fiat_currency text not null,
  spread_bps integer not null,
  min_usdc numeric(20, 7) not null,
  max_usdc numeric(20, 7) not null,
  available_usdc numeric(20, 7) not null,
  status text not null default 'open' check (status in ('open', 'paused', 'closed')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (min_usdc > 0),
  check (max_usdc >= min_usdc),
  check (available_usdc >= 0)
);

create index offers_merchant_id_idx on public.offers (merchant_id);

create table public.quotes (
  id uuid primary key default gen_random_uuid(),
  offer_id uuid not null references public.offers (id) on delete restrict,
  buyer_profile_id uuid not null references public.profiles (id) on delete restrict,
  usdc_amount numeric(20, 7) not null check (usdc_amount > 0),
  fiat_amount numeric(20, 4) not null check (fiat_amount > 0),
  fiat_currency text not null,
  reflector_snapshot jsonb not null,
  spread_bps integer not null,
  expires_at timestamptz not null,
  created_at timestamptz not null default now()
);

create table public.orders (
  id uuid primary key default gen_random_uuid(),
  quote_id uuid not null unique references public.quotes (id) on delete restrict,
  status text not null default 'created'
    check (status in ('created', 'reserved', 'escrow_pending', 'fiat_pending', 'released', 'cancelled', 'disputed')),
  engagement_id text not null unique,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.escrow_sessions (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null unique references public.orders (id) on delete restrict,
  tw_contract_id text,
  milestone_state text not null default 'idle',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.profiles enable row level security;
alter table public.merchants enable row level security;
alter table public.offers enable row level security;
alter table public.quotes enable row level security;
alter table public.orders enable row level security;
alter table public.escrow_sessions enable row level security;
