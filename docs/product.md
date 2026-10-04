# What UPEER does

UPEER is a peer-to-peer (P2P) marketplace for buying and selling USDC against local currency on the Stellar network. You post or take an order at a posted fiat price per USDC. The USDC leg settles in Trustless Work single-release escrow. Fiat moves off-chain between you and your counterparty.

This page is conceptual. For local setup and routes, see the [README](../README.md). For the click-by-click trade, see [How a trade works](./how-a-trade-works.md). For integrations and diagrams, see [Architecture](./architecture.md) and [User flows](./user-flows.md). Full list: [Documentation index](./README.md).

## Who it is for

UPEER targets LATAM P2P desks and counterparties in Costa Rica, Argentina, Bolivia, Chile, and Colombia. Fiat currencies on the book are CRC, ARS, BOB, CLP, and COP.

You sign in with a Pollar embedded Stellar wallet. After onboarding you pick an intent:

- **Buy USDC**: pay local currency, receive USDC
- **Sell USDC**: post a price, receive local currency
- **Buy and sell**: both directions on one account

Merchant verification is a separate desk listing. Any onboarded profile can post an order. Verified desks get extra tools under `/merchant`.

## What stays on-chain vs off-chain

| Leg | Where it happens | What UPEER records |
| --- | --- | --- |
| USDC | Stellar, via Trustless Work escrow | Deploy, fund, approve, release |
| Fiat | Bank, wallet rail, or cash between peers | “Fiat sent” and “fiat received” confirmations |

Confirmations in the app are not bank proof. Operators do not move fiat for you.

## Market model

The public book at `/market` lists open offers. Each offer has:

- **Side**: `sell_usdc` (desk sells USDC) or `buy_usdc` (desk buys USDC)
- **Price**: fiat units per 1 USDC, set by the maker
- **Size**: min, max, and remaining USDC
- **Maker**: the profile that posted

A taker requests a trade at that price. Size locks to the posted rate. The maker then accepts or declines. Quotes that sit unused expire after 5 minutes. A maker has 24 hours from order creation (or the quote deadline, whichever is later) to accept.

## Escrow roles

Roles follow who sells USDC, not who posted:

- On a `sell_usdc` listing, the maker is the USDC seller
- On a `buy_usdc` listing, the taker is the USDC seller

The USDC seller deploys, funds, approves, and releases escrow. The USDC buyer sends fiat and receives USDC on release. Platform address `UPEER_PLATFORM_ADDRESS` is an escrow operator role (a Stellar `G` address, not a Pollar user id). Default platform fee is 50 basis points when `UPEER_PLATFORM_FEE_BPS` is unset.

## Wallet

`/wallet` shows Pollar balances. You can send Stellar assets and, when Pollar swap venues are enabled, swap (including funding USDC via XLM → USDC). Swap stays unavailable until you enable at least one venue in the Pollar dashboard under Treasury → Swap.

## What UPEER is not

UPEER is not a custodial exchange. It does not hold pooled user USDC or move fiat through a platform bank. It is not a licensed money transmitter. Terms and privacy pages are placeholders until legal copy is final.

Current development targets Stellar testnet unless you set the network env to mainnet.
