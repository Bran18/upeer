# User flows

Mermaid diagrams for the main journeys. Pair with [How a trade works](./how-a-trade-works.md) for manual test steps and [Architecture](./architecture.md) for APIs and integrations.

## Sign-in and onboarding

```mermaid
flowchart TD
  A["Visit /"] --> B{"Pollar publishable key set?"}
  B -->|No| C["Browse market only / banner"]
  B -->|Yes| D["Open Pollar login"]
  D --> E["POST /api/auth/pollar"]
  E --> F["Profile upsert in Supabase"]
  F --> G{"onboardingComplete?"}
  G -->|No| H["/onboarding: pick buyer, merchant, or both"]
  H --> I["POST /api/onboarding"]
  I --> J["/market"]
  G -->|Yes| J
```

`OnboardingGate` (`components/session/onboarding-gate.tsx`) redirects authenticated users without onboarding to `/onboarding`.

## Browse and post (maker)

```mermaid
flowchart TD
  M["/market"] --> N["Filter open offers"]
  N --> O["/orders/new"]
  O --> P["Wizard: side, currency, price, size, payout"]
  P --> Q["POST /api/offers"]
  Q --> R["Listing on /market"]
```

Verified merchants also use `/merchant` and `/dashboard` for desk tools. Any onboarded user can post if payout and prefs are valid.

## Take a trade (taker)

```mermaid
flowchart TD
  T1["/market → offer card"] --> T2["/trade/offerId"]
  T2 --> T3["Enter USDC size in min/max"]
  T3 --> T4["POST /api/quotes"]
  T4 --> T5["POST /api/orders"]
  T5 --> T6["Order: pending_acceptance"]
  T6 --> T7["Notification to maker"]
```

On `buy_usdc` listings the taker may be the USDC seller and selects a fiat receive method before submit.

## Maker accept and liquidity

```mermaid
flowchart TD
  A1["/orders/orderId"] --> A2{"Maker?"}
  A2 -->|Yes| A3["Review quote + counterparty"]
  A3 --> A4["Pick fiat rail on sell_usdc maker side"]
  A4 --> A5["POST /api/orders/id/accept"]
  A5 --> A6["available_usdc reduced"]
  A6 --> A7["Status → reserved / escrow_pending"]
  A2 -->|No| A8["Wait or view progress"]
  A3 --> D1["POST decline → declined"]
```

Accept window: 24 hours from order creation or quote expiry, whichever is later (`lib/quotes/ttl.ts`).

## USDC escrow and fiat (both parties)

```mermaid
flowchart TD
  subgraph onchain["On-chain (USDC seller)"]
    E1["Deploy escrow"] --> E2["Fund USDC"]
    E2 --> E3["Escrow funded"]
  end

  subgraph fiat["Off-chain (peers)"]
    F1["Buyer: mark fiat sent"] --> F2["Seller: mark fiat received"]
  end

  subgraph release["On-chain (USDC seller)"]
    R1["Approve milestone"] --> R2["Release USDC to buyer"]
  end

  A7["After accept"] --> E1
  E3 --> F1
  F2 --> R1
  R2 --> Done["Order released"]
```

Fiat steps call `POST /api/orders/[id]/confirm` with role-specific payloads. Payment instructions come from the seller’s saved methods (`lib/profile/payment-prefs.ts`).

## Wallet (send and swap)

```mermaid
flowchart LR
  W["/wallet"] --> B["Balances via Pollar"]
  W --> S["Send: Pollar transfer"]
  W --> X["Swap: Pollar venues"]
  X --> V{"Swap venue enabled in Pollar dashboard?"}
  V -->|No| U["Swap tab unavailable"]
  V -->|Yes| OK["Headless swap UI"]
```

Swap is client-side through `@pollar/react`; UPEER does not proxy swap quotes on the server.

## Operator and admin

```mermaid
flowchart TD
  O1["profiles.is_operator = true"] --> O2["/admin"]
  O2 --> O3["Merchant approve / reject"]
  O2 --> O4["Overview metrics"]
  K["UPEER_OPERATOR_API_KEY"] --> O5["Admin API routes"]
```

`POST /api/escrow/resolve` links an on-chain Trustless Work contract to the order when deploy happened outside the normal UI path.
