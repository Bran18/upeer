# How a trade works

This how-to walks two people through one P2P USDC trade on UPEER. Use two browsers (or two devices) and two Pollar wallets.

You need a running app with Pollar, Supabase, Trustless Work, and `UPEER_PLATFORM_ADDRESS` configured. See the [README](../README.md).

## Before you trade

1. Sign in on `/` with Pollar.
2. Finish `/onboarding` and choose buy, sell, or both.
3. Add a payout Stellar address (a `G…` account) when you post or sell USDC.
4. Save a fiat payment method for the market currency under **Account → Preferences**.

Payment rails depend on country. Examples: SINPE Móvil (Costa Rica), Mercado Pago or CBU/CVU (Argentina), Yape (Bolivia), MACH/Tenpo or bank transfer (Chile), Nequi or Daviplata (Colombia). Cash in person and Other are available in every market.

## Post an order (maker)

1. Open `/orders/new`.
2. Choose **sell USDC** or **buy USDC**.
3. Set currency, price per USDC, and size (min, max, available).
4. Confirm payout address and review.
5. Submit. The listing appears on `/market`.

## Request a trade (taker)

1. Open `/market` and pick an open offer.
2. Open `/trade/[offerId]` and enter a USDC amount inside the offer bounds.
3. If you are the USDC seller on a `buy_usdc` listing, choose how you receive fiat.
4. Submit **Request trade**. The order lands in `pending_acceptance`.

The maker gets an in-app notification. Open `/orders` (Activity) or the order URL.

## Accept or decline (maker)

On `/orders/[orderId]`:

1. Review size, price, and counterparties.
2. On a `sell_usdc` listing, choose how you receive fiat before you accept.
3. Click **Accept Trade**, or decline if you will not fill it.

Accept locks remaining offer liquidity for that size. Status moves toward escrow (typically `reserved` / `escrow_pending`).

## Deploy and fund escrow (USDC seller)

The USDC seller signs Trustless Work transactions in Pollar:

1. **Deploy** the single-release escrow contract.
2. **Fund** it with the USDC amount for the trade.
3. Wait until the app shows escrow funded (on-chain status plus the DB milestone).

The USDC buyer does not fund this contract.

## Confirm fiat (both)

Fiat stays off-chain. In the order screen:

1. The USDC buyer marks fiat sent after they pay the posted rail details.
2. The USDC seller marks fiat received after they see the money.

These timestamps live on the order as `fiat_confirmation`. They are attestations, not bank receipts.

## Release USDC (USDC seller)

After fiat received:

1. The USDC seller **approves** the milestone.
2. The USDC seller **releases** USDC to the buyer’s Stellar address.

Status becomes `released`. The buyer should see USDC in `/wallet` on testnet (or mainnet if you configured that network).

## If something stops the trade

| Situation | What happens |
| --- | --- |
| Maker declines while `pending_acceptance` | Order is `declined`; liquidity returns |
| Quote unused for 5 minutes | Quote can no longer open a new take |
| Maker misses the 24 hour accept window | Take can no longer be accepted |
| Dispute | Status can move to `disputed`; operators use `/admin` |

Operators set `profiles.is_operator = true`, or call operator APIs with `UPEER_OPERATOR_API_KEY`.
