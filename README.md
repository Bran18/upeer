# UPEER

P2P commercial infrastructure: a **USDC OTC marketplace** on Stellar. Buyers meet verified merchants, receive executable quotes (Reflector reference + spread), and settle the digital-asset leg through **Trustless Work V1 single-release** escrow. Optional **Soroswap** swaps fund wallets without replacing OTC flow.

**Login:** [Pollar](https://docs.pollar.xyz) embedded wallets (`@pollar/react`).

## Stack

- Next.js App Router (BFF route handlers for secrets)
- Supabase Postgres (RLS on; server uses service role)
- Reflector Pulse (`@reflector/contract-client`)
- Trustless Work V1 (`x-api-key`, testnet: `https://dev.api.trustlesswork.com`)
- Soroswap API (`Authorization: Bearer sk_…`)

## Quick start

```bash
cp .env.example .env.local
# Fill Pollar, UPEER_SESSION_SECRET, SUPABASE_SERVICE_ROLE_KEY (+ URL/publishable), optional TW/Soroswap
# Then visit http://localhost:3000/api/health to see what is still missing

npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

| Route | Purpose |
| --- | --- |
| `/` | Product overview |
| `/market` | Offer browse |
| `/trade/[offerId]` | Quote + escrow flow |
| `/merchant` | Merchant application |
| `/app` | Integration console |

## Trustless Work roles (sell USDC)

For `sell_usdc`, the merchant is `serviceProvider` and funds escrow; the buyer is `receiver`. UPEER platform addresses (`UPEER_PLATFORM_ADDRESS`) act as `approver`, `releaseSigner`, `disputeResolver`, and `platformAddress`. Platform keys must **not** be loaded into Pollar.

## Merchant → market flow

1. Sign in (Pollar) → **Console** → **Sync server session** (requires `SUPABASE_SERVICE_ROLE_KEY`).
2. **Merchants** → apply → operator approves:
   ```bash
   curl -X POST "http://localhost:3000/api/admin/merchants/<merchant-uuid>/decision" \
     -H "Content-Type: application/json" \
     -H "x-upeer-operator-key: $UPEER_OPERATOR_API_KEY" \
     -d '{"decision":"approved"}'
   ```
3. Set **payout address**, publish offer → appears on **Market** (real UUID trade links).
4. Buyer: quote → reserve → deploy escrow (`UPEER_PLATFORM_ADDRESS` required).

## Testnet disclaimer

Fiat is off-chain. User payment declarations do not confirm fiat on testnet.

## Supabase

Migrations live in `supabase/migrations/`. Link your project:

```bash
npx supabase link --project-ref cbxlmgvwcfcnopvvggmx
```
