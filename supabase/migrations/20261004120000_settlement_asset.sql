-- On-chain asset for escrow (USDC, XLM, USDT0). Column names *_usdc remain unit amounts.

alter table public.offers
  add column if not exists settlement_asset text not null default 'USDC'
    check (settlement_asset in ('USDC', 'XLM', 'USDT0'));

alter table public.quotes
  add column if not exists settlement_asset text not null default 'USDC'
    check (settlement_asset in ('USDC', 'XLM', 'USDT0'));

create index if not exists offers_open_market_idx
  on public.offers (status, fiat_currency, settlement_asset)
  where status = 'open';

comment on column public.offers.settlement_asset is
  'Stellar asset held in Trustless Work escrow for this listing';

comment on column public.quotes.settlement_asset is
  'Snapshot of offer settlement_asset at quote time';
