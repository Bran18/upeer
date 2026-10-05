# Pollar in UPEER

[Pollar](https://docs.pollar.xyz/) is UPEER’s **identity and Stellar wallet layer**: embedded login, balances, send, receive, transaction history, and **swap** (Treasury → Swap venues). The order book does not convert USDC ↔ XLM ↔ USDT0; users fund the right settlement asset in `/wallet` (including swap) before they post or take trades.

Related: [Trustless Work](./integration-trustless-work.md) (escrow XDR signing), [Reflector](./integration-reflector.md) (server FX reads), [Architecture](./architecture.md).

## Role in the P2P model

```mermaid
flowchart TB
  subgraph pollar_cloud["Pollar"]
    Login["Auth + embedded wallet"]
    Bal["Balances & history"]
    SwapVenues["Swap routing<br/>Soroswap / Aquarius / SDEX"]
  end

  subgraph upeer_app["UPEER"]
    Session["UPEER session JWT + profile"]
    Market["Market / orders / fiat UI"]
    EscrowUI["Order detail escrow actions"]
    WalletUI["/wallet send & swap"]
  end

  subgraph upeer_server["UPEER server"]
    AuthAPI["POST /api/auth/pollar"]
    EscrowAPI["/api/escrow/*"]
  end

  Login --> Session
  AuthAPI -->|"verify token"| Login
  Session --> Market
  Session --> WalletUI
  EscrowUI -->|"signAndSubmitTx"| Login
  EscrowAPI -.->|"unsigned XDR"| EscrowUI
  WalletUI --> Bal
  WalletUI --> SwapVenues
  Bal --> Market
```

| Capability | Where | P2P use |
| --- | --- | --- |
| Login | `PollarProvider`, login modal | Every authenticated flow |
| Stellar `G…` on profile | `POST /api/auth/pollar` → Supabase | Counterparty addresses, escrow roles |
| `signAndSubmitTx` | Order detail | Deploy / fund / approve / release escrow |
| `walletBalance` | `/wallet`, posting liquidity | Know available USDC/XLM/USDT0 |
| `sendPayment` | `/wallet` send | Optional transfers outside escrow |
| `getSwapQuote` + `swap` | `/wallet` swap | Get listing asset before trade |

## Session bridge (app auth)

Pollar access tokens never replace UPEER’s own session. The browser exchanges them once; the server verifies with the **secret** key.

```mermaid
sequenceDiagram
  participant U as User browser
  participant PR as @pollar/react
  participant N as POST /api/auth/pollar
  participant PS as Pollar Server API
  participant SB as Supabase profiles

  U->>PR: Login modal
  PR-->>U: access token + wallet hint
  U->>N: token + optional stellarAddress
  N->>PS: POST /v1/tokens/verify (POLLAR_SECRET_KEY)
  PS-->>N: userId, network, wallet
  N->>SB: upsert profile (stellar G…)
  N-->>U: Set-Cookie upeer session + accessToken JSON
  U->>N: Authed /api/* (cookie + Bearer)
```

Implementation: `components/providers/app-providers.tsx`, `lib/pollar/server.ts`, `lib/upeer-api.ts` (`exchangePollarSessionFromClient`).

Network on the Pollar app must match `STELLAR_NETWORK` / `NEXT_PUBLIC_STELLAR_NETWORK`.

## Escrow signing (with Trustless Work)

Trustless Work builds transactions server-side; Pollar is the **only** signer in the browser.

```mermaid
sequenceDiagram
  participant UI as Order detail
  participant P as Pollar signAndSubmitTx
  participant N as /api/escrow/deploy|fund|approve|release
  participant TW as Trustless Work

  UI->>N: orderId + signer G…
  N->>TW: build unsigned XDR
  TW-->>N: unsignedTransaction
  N-->>UI: XDR
  UI->>P: sign & submit
  P-->>UI: tx hash
  UI->>N: /api/escrow/submit { txHash, phase }
```

On-chain seller actions are gated in UI by `p2pLegs` + `wallet.address` (`use-order-detail.ts`).

## Wallet: send and swap

Swap is **client-side** through the Pollar SDK (not UPEER route handlers). Venues and buy tokens come from the Pollar dashboard (**Treasury → Swap**).

```mermaid
flowchart TB
  subgraph wallet_page["/wallet"]
    QB["Quick actions: Send | Swap"]
    SendF["WalletSendForm<br/>sendPayment"]
    SwapF["WalletSwapForm"]
  end

  subgraph pollar_sdk["Pollar SDK"]
    GSC["getSwapConfig → venues"]
    GST["getSwapTokens → buy list"]
    GSQ["getSwapQuote"]
    SW["swap(quote)"]
  end

  subgraph dex["Liquidity"]
    V["auto | soroswap | aquarius | sdex"]
  end

  QB --> SendF
  QB --> SwapF
  SwapF --> GSC
  SwapF --> GST
  SwapF --> GSQ
  SwapF --> SW
  GSQ --> V
  SW --> V
  SW -->|"success"| BalRefresh["refreshWalletBalance"]
```

`lib/pollar/swap-assets.ts` maps Pollar tokens to Stellar asset refs (native XLM vs credit codes). If the user lacks a trustline for the buy asset, the UI offers **Create Trustline & Swap**. Smart (passkey) custody wallets skip swap until supported.

Swap supports **funding** for P2P; it is not invoked from `/trade/[offerId]`. Takers must already hold the offer’s `settlement_asset` (or acquire it via swap first).

## End-to-end: three integrations

```mermaid
flowchart TB
  subgraph prepare["Prepare"]
    R["Reflector<br/>optional LATAM FX reference"]
    W["Pollar wallet + swap<br/>hold USDC / XLM / USDT0"]
  end

  subgraph trade["Trade off-chain terms"]
    M["Market & quotes<br/>fiat per unit"]
    F["Fiat payment between peers"]
  end

  subgraph chain["On-chain settlement"]
    TW["Trustless Work escrow"]
    Sig["Pollar signatures"]
  end

  R -.-> M
  W --> M
  M --> TW
  F -.-> M
  TW --> Sig
  Sig --> W
```

1. **Reflector** — optional oracle reads for pricing context (`GET /api/prices/reference`).  
2. **Pollar** — who you are, what you hold, swap to the right asset, sign escrow.  
3. **Trustless Work** — escrow contract that releases the asset when the seller completes approve/release after fiat attestation.

## Configuration

| Variable | Purpose |
| --- | --- |
| `NEXT_PUBLIC_POLLAR_PUBLISHABLE_KEY` | Client `PollarProvider` |
| `POLLAR_SECRET_KEY` | Server token verify |
| `POLLAR_SERVER_URL` | Optional (default `https://server.api.pollar.xyz`) |

Pollar dashboard (not env): enabled assets, swap venues, buy tokens (e.g. USDT0 on mainnet).

Without the publishable key, `PollarRequired` surfaces a banner; escrow and wallet flows need login.
