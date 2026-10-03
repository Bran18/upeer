# UPEER

P2P USDC marketplace on Stellar: users **post orders** at a fiat price per USDC, **request trades**, makers **accept**, then the USDC leg settles through **Trustless Work** single-release escrow. Fiat is off-chain between peers. Optional **Soroswap** swaps help fund wallets on testnet.

**Login:** [Pollar](https://docs.pollar.xyz) embedded wallets (`@pollar/react`).

## Stack

- Next.js App Router (BFF route handlers for secrets)
- Supabase Postgres (server uses service role)
- Trustless Work V1 (`TRUSTLESS_WORK_API_KEY`, testnet: `https://dev.api.trustlesswork.com`)
- Soroswap API (`SOROSWAP_API_KEY`)
- Reflector Pulse (optional; developer tools / reference only)

## Quick start

```bash
cp .env.example .env.local
# Pollar, UPEER_SESSION_SECRET, Supabase URL + service role
# Trustless Work + UPEER_PLATFORM_ADDRESS for escrow
# Optional: SOROSWAP_API_KEY

npm install
npm run dev
```

Visit [http://localhost:3000](http://localhost:3000) and check [http://localhost:3000/api/health](http://localhost:3000/api/health).

## Routes

| Route | Purpose |
| --- | --- |
| `/` | Landing |
| `/market` | Open orders |
| `/orders/new` | Post order (any onboarded user) |
| `/orders` | Your trades |
| `/orders/[id]` | Accept / escrow / fiat confirmation |
| `/trade/[offerId]` | Request trade on a listing |
| `/dashboard` | Account + Soroswap fund USDC |
| `/admin` | Operators (`profiles.is_operator`) |
| `/app` | Integration diagnostics |

## P2P flow (two users)

1. **User A** — Sign in → `/orders/new` → set payout address, price, size → post.
2. **User B** — `/market` → open listing → **Request trade**.
3. **User A** — Notification → `/orders/[id]` → **Accept** (liquidity locks).
4. **USDC seller** — Deploy + fund escrow (Trustless Work). On `sell_usdc` listings that is the desk (maker); on `buy_usdc` listings that is the taker.
5. **Both** — USDC buyer marks fiat sent; USDC seller marks fiat received (P2P).
6. **USDC seller** — Approve milestone & release USDC to the buyer.

## Migrations

SQL lives in `supabase/migrations/`. Linked project ref in README history: `cbxlmgvwcfcnopvvggmx`.

```bash
npx supabase link --project-ref cbxlmgvwcfcnopvvggmx
npx supabase db push
```

## Operator

Set `is_operator = true` on your `profiles` row, or use `UPEER_OPERATOR_API_KEY` for API decisions.

## Manual test checklist

- [ ] Two Pollar wallets, two browsers
- [ ] A posts COP (or MXN) order with payout G…
- [ ] B requests trade; A sees notification and accepts
- [ ] Escrow deploy/fund with TW env configured
- [ ] Fiat confirmations; release completes order
- [ ] Empty `/market` when no rows (no mock data)

## Testnet disclaimer

Fiat is off-chain. Confirmations in the app are not bank proof.
