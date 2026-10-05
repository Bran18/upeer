# What UPEER does

UPEER is a peer-to-peer (P2P) marketplace for buying and selling **USDC**, **XLM**, or **USDT0** against local currency on the Stellar network. You post or take an order at a posted fiat price **per unit of the chosen asset**. The on-chain leg settles in Trustless Work single-release escrow. Fiat moves off-chain between you and your counterparty.

This page is conceptual. For local setup and routes, see the [README](../README.md). For the click-by-click trade, see [How a trade works](./how-a-trade-works.md). For integrations and diagrams, see [Architecture](./architecture.md) and [User flows](./user-flows.md). Full list: [Documentation index](./README.md).

## Who it is for

UPEER targets LATAM P2P desks and counterparties in Costa Rica, Argentina, Bolivia, Chile, Colombia, and **Brazil**. Fiat currencies on the book are CRC, ARS, BOB, CLP, COP, and **BRL**.

You sign in with a Pollar embedded Stellar wallet. After onboarding you pick an intent:

- **Buy**: pay local currency, receive the listing asset from escrow
- **Sell**: post a price, receive local currency
- **Buy and sell**: both directions on one account

Listing a **merchant desk** (`/merchant`) sets your public name and readiness checklist; there is no operator approval step. Post orders from `/orders/new` once payout and payment methods are set.

## Settlement assets

Each offer stores `settlement_asset`:

| Asset | Where it works | Notes |
| --- | --- | --- |
| **USDC** | Testnet and mainnet | Circle-issued; default for existing rows |
| **XLM** | Testnet and mainnet | Native Stellar; no trustline for holders |
| **USDT0** | Mainnet only | [USDT0 on Stellar](https://developers.stellar.org/launch/usdt0); issuer can freeze/claw back |

Takers must match the desk’s asset. There is no in-app USDC↔XLM↔USDT0 conversion on the order book. Users can swap between assets in `/wallet` when Pollar swap is configured.

API and UI still use `sell_usdc` / `buy_usdc` for **trade direction** (whether the maker sells or buys the on-chain asset). Labels in the app read “Buy XLM”, “Price per USDT0”, and so on from `settlement_asset`.

## What stays on-chain vs off-chain

| Leg | Where it happens | What UPEER records |
| --- | --- | --- |
| Escrow asset (USDC, XLM, or USDT0) | Stellar, via Trustless Work | Deploy, fund, approve, release |
| Fiat | Bank, wallet rail, or cash between peers | “Fiat sent” and “fiat received” confirmations |

Confirmations in the app are not bank proof. Operators do not move fiat for you.

## Fiat rails (P2P)

UPEER does not connect to banks or PIX APIs for the marketplace. Sellers save **how a counterparty pays them** in `profiles.payment_prefs`. Examples:

| Market | Common rails |
| --- | --- |
| Costa Rica | SINPE Móvil, bank IBAN |
| Argentina | Mercado Pago, CBU/CVU alias |
| Bolivia | Yape, bank transfer |
| Chile | MACH/Tenpo, bank transfer |
| Colombia | Nequi, Daviplata, bank transfer |
| **Brazil** | **PIX** (chave: CPF, CNPJ, email, phone, EVP), bank transfer |

Cash in person and Other are available in every market.

### PIX (Brazil) vs provider ramp

- **P2P PIX:** the buyer sends BRL to the seller’s **PIX chave** you saved in settings. Escrow still holds USDC/XLM/USDT0; UPEER never touches BRL.
- **Provider ramp (optional):** fund your own wallet with BRL via a licensed partner (e.g. [LATAM Ramp Kit](https://github.com/armandocodecr/latam-ramp-kit) + Etherfuse/Manteca). That path delivers **USDC** to your Pollar wallet, not a P2P order. It is separate from the order book.

## Market model

The public book at `/market` lists open offers. Each offer has:

- **Side**: `sell_usdc` (desk sells the asset) or `buy_usdc` (desk buys the asset)
- **Settlement asset**: USDC, XLM, or USDT0
- **Price**: fiat units per 1 unit of that asset
- **Size**: min, max, and remaining amount (stored in `*_usdc` columns as unit amounts)
- **Maker**: the profile that posted

Filter by fiat market and settlement asset. A taker requests a trade at that price. The maker accepts or declines. Quotes expire after 5 minutes. The maker has 24 hours from order creation (or the quote deadline, whichever is later) to accept.

## Escrow roles

Roles follow who **sells the on-chain asset**, not who posted first:

- On a `sell_usdc` listing, the maker is the seller
- On a `buy_usdc` listing, the taker is the seller

The seller deploys, funds, approves, and releases escrow. The buyer sends fiat and receives the asset on release. `UPEER_PLATFORM_ADDRESS` is an escrow operator role (Stellar `G…`, not a Pollar user id). Default platform fee is 50 bps when `UPEER_PLATFORM_FEE_BPS` is unset. The platform account needs trustlines (and balances) for each asset you list in production.

Trustless Work deploy sends `trustline: { address, symbol }` — issuer `G…` for USDC/USDT0, native SAC contract id for XLM. See `lib/settlement/assets.ts`.

## Wallet

`/wallet` shows Pollar balances. Send any enabled Stellar asset. Swap uses Pollar venues (**Treasury → Swap** in the Pollar dashboard). Enable **USDT0** there for mainnet wallets; trustlines may be created via swap (“Create Trustline & Swap”) or Pollar sponsorship when the asset is app-configured.

## What UPEER is not

UPEER is not a custodial exchange. It does not hold pooled user funds or move fiat through a platform bank. It is not a licensed money transmitter. Terms and privacy pages are placeholders until legal copy is final.

Default development targets Stellar **testnet** unless you set the network env to mainnet.
