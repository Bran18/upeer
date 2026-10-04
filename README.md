# UPEER

UPEER is a P2P USDC marketplace on Stellar. You post or take an order at a fiat price per USDC, the maker accepts, then the USDC leg settles in [Trustless Work](https://docs.trustlesswork.com) single-release escrow. Fiat moves directly between peers. Sign-in uses [Pollar](https://docs.pollar.xyz) embedded wallets.

Coverage: Costa Rica (CRC), Argentina (ARS), Bolivia (BOB), Chile (CLP), Colombia (COP).

## Documentation

| Doc | Description |
| --- | --- |
| [docs/](docs/README.md) | Documentation index |
| [What UPEER does](docs/product.md) | Product model and coverage |
| [How a trade works](docs/how-a-trade-works.md) | Two-wallet test walkthrough |
| [Architecture](docs/architecture.md) | Integrations, BFF, APIs, Mermaid system diagram |
| [User flows](docs/user-flows.md) | Onboarding, market, escrow journeys (Mermaid) |

## Stack

- Next.js App Router (BFF route handlers hold secrets)
- Supabase Postgres (server uses the service role)
- Trustless Work V1 (testnet API: `https://dev.api.trustlesswork.com`)
- Pollar wallets, send, and swap
- Reflector Pulse for LATAM FX reference (optional)

## Run locally

```bash
cp .env.example .env.local
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). Check config at [http://localhost:3000/api/health](http://localhost:3000/api/health). The health JSON reports which keys are present; it does not print secrets.

Minimum `.env.local` for a working trade:

| Variable | Used for |
| --- | --- |
| `NEXT_PUBLIC_POLLAR_PUBLISHABLE_KEY`, `POLLAR_SECRET_KEY` | Embedded wallet login |
| `UPEER_SESSION_SECRET` | Server session cookie (min 32 chars; required outside development) |
| `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`, `SUPABASE_SERVICE_ROLE_KEY` | Profiles, offers, orders |
| `TRUSTLESS_WORK_API_KEY`, `UPEER_PLATFORM_ADDRESS` | Escrow deploy |

Optional: `REFLECTOR_PULSE_CONTRACT_ID` and `REFLECTOR_RPC_URL` for FX feeds; `UPEER_PLATFORM_FEE_BPS` (default `50`); `UPEER_OPERATOR_API_KEY` for operator API calls; `STELLAR_NETWORK=testnet` or `mainnet`. Mainnet also needs `STELLAR_MAINNET_RPC_URL`.

Copy every name from `.env.example`. Never prefix the service role with `NEXT_PUBLIC_`.

### Wallet swap

Enable at least one swap venue and buy tokens (for example USDC) in the [Pollar dashboard](https://docs.pollar.xyz) under **Treasury → Swap**. Until then, `/wallet` shows swap as unavailable. See the [Pollar swaps guide](https://docs.pollar.xyz/docs/guides/swaps-guide).

## Routes

| Route | Purpose |
| --- | --- |
| `/` | Landing |
| `/market` | Open offers (`/exchange` redirects here) |
| `/orders/new` | Post an order |
| `/trade/[offerId]` | Request a trade on a listing |
| `/orders`, `/activity` | Your trades |
| `/orders/[orderId]` | Accept, escrow, fiat confirmation, release |
| `/wallet` | Balances, send, swap |
| `/account`, `/settings` | Profile and payment methods |
| `/onboarding` | Role and display name |
| `/merchant` | Desk tools (merchant or both intent) |
| `/dashboard` | Desk performance |
| `/admin` | Operators (`profiles.is_operator`) |
| `/app` | Redirects to the dashboard |

## Database

SQL lives in `supabase/migrations/`. Linked project ref used in this repo: `cbxlmgvwcfcnopvvggmx`.

```bash
npx supabase link --project-ref cbxlmgvwcfcnopvvggmx
npx supabase db push
```

## Operators

Set `is_operator = true` on your `profiles` row, or send `UPEER_OPERATOR_API_KEY` on operator API routes.

## Test a full trade

Use two Pollar wallets and two browsers:

1. Maker posts a CRC, ARS, BOB, CLP, or COP order with a payout `G…` address.
2. Taker requests the trade; maker accepts from the notification or `/orders/[id]`.
3. USDC seller deploys and funds Trustless Work escrow.
4. Buyer marks fiat sent; seller marks fiat received.
5. Seller approves and releases USDC.
6. Confirm `/wallet` send. Swap only works after Pollar venues are enabled.
7. Empty `/market` when there are no rows (no mock data).

## Testnet disclaimer

Fiat is off-chain. In-app confirmations are not bank proof. Default network is Stellar testnet.
