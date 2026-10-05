# How a trade works

This how-to walks two people through one P2P trade on UPEER. Use two browsers (or two devices) and two Pollar wallets.

You need a running app with Pollar, Supabase, Trustless Work, and `UPEER_PLATFORM_ADDRESS` configured. See the [README](../README.md). For system diagrams see [Architecture](./architecture.md) and [User flows](./user-flows.md).

## Before you trade

1. Sign in on `/` with Pollar.
2. Finish `/onboarding` and choose buy, sell, or both.
3. Add a payout Stellar address (a `G…` account) when you post or sell the on-chain asset.
4. Save a fiat payment method for the market currency under **Account → Preferences**.

Payment rails depend on country. Examples: SINPE Móvil (Costa Rica), Mercado Pago or CBU/CVU (Argentina), Yape (Bolivia), MACH/Tenpo or bank transfer (Chile), Nequi or Daviplata (Colombia), **PIX** or bank transfer (Brazil). Cash in person and Other are available in every market.

For **Brazil**, add a **PIX** method with key type (CPF, CNPJ, email, phone, or EVP) and the chave value.

## Post an order (maker)

1. Open `/orders/new`.
2. Choose **sell** or **buy** (the on-chain asset direction).
3. Pick **settlement asset**: USDC, XLM, or USDT0 (USDT0 only on mainnet).
4. Set fiat market, **price per 1 unit** of that asset, and size (min, max, available).
5. Confirm payout address and review.
6. Submit. The listing appears on `/market` with an asset badge.

## Request a trade (taker)

1. Open `/market`. Filter by fiat and/or **asset** if needed.
2. Open `/trade/[offerId]` and enter an amount inside the offer bounds (in the listing asset).
3. If you are the on-chain seller on a `buy_usdc` listing, choose how you receive fiat.
4. Submit **Request trade**. The order lands in `pending_acceptance`.

The maker gets an in-app notification. Open `/orders` (Activity) or the order URL.

## Accept or decline (maker)

On `/orders/[orderId]`:

1. Review size, price, asset, and counterparties.
2. On a `sell_usdc` listing, choose how you receive fiat before you accept.
3. Click **Accept Trade**, or decline if you will not fill it.

Accept locks remaining offer liquidity for that size. Status moves toward escrow (typically `reserved` / `escrow_pending`).

## Deploy and fund escrow (on-chain seller)

The seller signs Trustless Work transactions in Pollar:

1. **Deploy** the single-release escrow for the quote’s `settlement_asset`.
2. **Fund** it with the trade amount in that asset.
3. Wait until the app shows escrow funded (on-chain status plus the DB milestone).

The buyer does not fund this contract. For USDC/USDT0, ensure trustlines exist on seller, buyer, and platform addresses.

## Confirm fiat (both)

Fiat stays off-chain. In the order screen:

1. The buyer marks fiat sent after they pay using the posted rail details (e.g. PIX chave).
2. The seller marks fiat received after they see the money.

These timestamps live on the order as `fiat_confirmation`. They are attestations, not bank receipts.

## Release (on-chain seller)

After fiat received:

1. The seller **approves** the milestone.
2. The seller **releases** the escrow asset to the buyer’s Stellar address.

Status becomes `released`. The buyer should see the asset in `/wallet`.

## If something stops the trade

| Situation | What happens |
| --- | --- |
| Maker declines while `pending_acceptance` | Order is `declined`; liquidity returns |
| Quote unused for 5 minutes | Quote can no longer open a new take |
| Maker misses the 24 hour accept window | Take can no longer be accepted |
| Dispute | Status can move to `disputed`; operators use `/admin` |

Operators set `profiles.is_operator = true`, or call operator APIs with `UPEER_OPERATOR_API_KEY`.
