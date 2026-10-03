-- P2P orders: list an explicit fiat price per USDC (spread_bps kept for legacy rows).

alter table public.offers
  add column if not exists price_per_usdc numeric(20, 8);

update public.offers
set price_per_usdc = case fiat_currency
  when 'COP' then 4100
  when 'MXN' then 17.5
  when 'USD' then 1
  else 1
end
where price_per_usdc is null;

alter table public.offers
  alter column price_per_usdc set not null;

alter table public.offers
  alter column spread_bps set default 0;
