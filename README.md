# Hood Desk

**AI-run trading desk on Robinhood Chain** — create projects, fair-launch tokens, chat the agent, hold `$HOOD`.

Tagline: *AI business. Robinhood Chain. No humans required for ops.*

Bankr-style flagship product for **Hood Street** (dark + `#CCFF00`, fox 🦊). Projects + fair-launch launchpad UX sit alongside the Desk agent skills catalog.

## vs siblings

| Project | Role | Port |
| --- | --- | --- |
| **Hood Desk** (this) | Flagship AI-run desk — landing, create/projects, fair launch, terminal + skills, $HOOD, ops, revenue | **5182** |
| **Hood Terminal** (`../hood-terminal`) | Chat / agent UI focus | **5181** |
| **HoodQuest** (`../hoodquest`) | Learn · Play · Build · Earn | **5180** |
| **hood-token** (`../hood-token`) | Draft Foundry ERC-20 fair-launch pattern (1B mint-once) | — |
| **gm-rh-miniapp** | Optional Farcaster GM / miniapp patterns | — |

Do not modify those repos from this app (read `hood-token` for fair-launch patterns only).

## Stack

- Vite + React 19 + TypeScript
- wagmi + viem + TanStack Query
- Robinhood Chain **4663**
- Dev server port **5182** (`--host 0.0.0.0`)

## Quick start

```bash
cd /Users/poker.vibe/Desktop/hood-desk
cp .env.example .env   # optional overrides
npm install
npm run dev            # http://0.0.0.0:5182
```

Build:

```bash
npm run build
npm run preview        # also :5182
```

## Subscriptions (cheap) + Stripe

| Tier | USD/mo | Focus |
| --- | --- | --- |
| **Starter** | **$4.99** | Auto-trade skills (DCA/TWAP), 1 deployer agent, basic social tips |
| **Desk** | **$9.99** | Full trading + deployer agents, social growth pack, **6 months updates** (`updatesUntil`), featured Skill Market |
| **Desk+** | **$19.99** | Everything + priority deploy stub, unlimited follows, multi-agent, higher XP |

Entitlements: `localStorage` key `hood-desk:sub:v1` (`tier`, `stripeCustomerId`/`stripeSessionId`, `updatesUntil`).

### Stripe setup (Laszlo)

1. Stripe Dashboard → **Products** (Test mode) — create 3 monthly prices: 4.99 / 9.99 / 19.99
2. Copy Price IDs → `VITE_STRIPE_PRICE_STARTER|DESK|DESK_PLUS`
3. Publishable key → `VITE_STRIPE_PUBLISHABLE_KEY`
4. Secret key → `STRIPE_SECRET_KEY` (server only — never commit)
5. `cd server && npm install && npm start` → **:8787** (Vite proxies `/api`)
6. Optional webhook: `checkout.session.completed` → `STRIPE_WEBHOOK_SECRET`

Without keys: Subscribe shows **Add Stripe keys** + **Activate (demo)** fallback.

Details: `server/README.md`, `.env.example`.

### Verified on-chain badge

Contracts verified on RH 4663 Blockscout show a **green check** next to token symbol (Trade, Projects, fair-launch, Rewards). Lib: `src/lib/verify/onchainVerified.ts`. Demo override: **Mark verified (demo)**. Never fake-verifies unknown addresses.

---

## Environment

| Variable | Required | Description |
|----------|----------|-------------|
| `VITE_RH_RPC` | No | Robinhood Chain RPC. **Fallback:** `https://rpc.mainnet.chain.robinhood.com` |
| `VITE_WC_PROJECT_ID` | No | WalletConnect Cloud project id |
| `VITE_HOOD_TOKEN` | No | Desk-wide `$HOOD` address after `hood-token` deploy |
| `VITE_STRIPE_PUBLISHABLE_KEY` | For live Checkout | Stripe pk_test / pk_live |
| `VITE_STRIPE_PRICE_STARTER` / `_DESK` / `_DESK_PLUS` | For live Checkout | Stripe Price IDs |
| `STRIPE_SECRET_KEY` | Server | sk_test — server/:8787 only |
| `STRIPE_WEBHOOK_SECRET` | Optional | Webhook signing secret |
| `HOODSTREET_MCP_URL` | No | Hoodstreet MCP endpoint. **Default:** `https://agent.hoodstreet.capital/mcp` |

Explorer: [robinhoodchain.blockscout.com](https://robinhoodchain.blockscout.com)

## Hoodstreet MCP integration (Neon / CCFF00 TBA)

**Live read-only agent** — resolves CCFF00 ERC-6551 token-bound accounts via Hoodstreet's MCP server.

### Server-side proxy

The Express server (`server/index.js`) acts as an MCP client proxy so the browser never talks MCP SSE directly. Endpoints under `/api/hoodstreet/...`:

| Endpoint | MCP tool | Description |
|----------|----------|-------------|
| `GET /api/hoodstreet/neon/:tokenId` | `get_neon_wallet` | Resolve CCFF00 TBA address |
| `GET /api/hoodstreet/neon/:tokenId/assets` | `get_neon_assets` | Get assets in TBA |
| `GET /api/hoodstreet/neon/:tokenId/balances` | `get_neon_balances` | Get token balances |
| `GET /api/hoodstreet/neon/:tokenId/activity` | `get_neon_activity` | Get transaction activity |
| `GET /api/hoodstreet/neon/:tokenId/token/:tokenAddress` | `get_wallet_token` | Get specific token (e.g. `$HOOD`) |

All endpoints support optional `?walletType=ccff00-erc6551` (default) or `eoa`.

### Agent skill

**`neon_tba`** — terminal skill that resolves a CCFF00 token ID → TBA address → `$HOOD` balance.

Examples: `neon tba 1`, `ccff00 tba 42`, `neon wallet 1000`

### Read-only v1

Only read tools are wired:
- ✅ `get_neon_wallet`, `get_neon_assets`, `get_neon_balances`, `get_neon_activity`
- ✅ `get_wallet_token`, `discover_wallet_tokens`, `get_wallet_nft`, `discover_wallet_nfts`
- ❌ Write/trade/mint flows (`prepare_*`, `confirm_*`, `execute_neon_trade`, mint) — out until product policy + Uni pool

### Environment

Set `HOODSTREET_MCP_URL` to override (e.g. local MCP server):

```bash
# .env
HOODSTREET_MCP_URL=http://localhost:3001/mcp
```

Default: `https://agent.hoodstreet.capital/mcp` (live production MCP endpoint).

### Local dev

Vite proxies `/api` → `:8787` automatically. Start both:

```bash
npm run server   # terminal 1 — Express :8787
npm run dev      # terminal 2 — Vite :5182
```

Open Terminal (`#/terminal`) → say **neon tba 1** to test.

## Sections (hash SPA)

1. **Landing** (`#/`) — pitch; CTA row **Trade | Skills | Rewards | Blog**
2. **Trade** (`#/trade`) — simulated fills only (no invent DEX routers)
3. **Skill Market** (`#/skills`) — follow/publish bots; demo follow/usage ledger
4. **Rewards** (`#/rewards`) — token creator + platform + bot/referrer demo fee split
5. **Blog** (`#/blog`, `#/blog/:slug`) — editable posts (`hood-desk:blog:v1`) + weekly banner admin
6. **Create project** (`#/create`) — name, ticker, socials, persona; sets `creatorAddress` when wallet connected
7. **Projects** (`#/projects`) — list; detail + **Launch fair token** wizard (I am creator toggle)
8. **Terminal** (`#/terminal`) — Desk chat + Skills panel + wallet rail
9. **$HOOD** (`#/hood`) — companion coin card
10. **Ops** / **Revenue** — loop + demo metrics
11. **Subscribe** (`#/subscribe`) — Starter / Desk / Desk+ + Stripe Checkout
12. **Account** (`#/account`) — XP + plan + updatesUntil

### Demo trade fee split

Constants in `src/lib/rewards/config.ts` (adjustable):

| Role | Share |
| --- | --- |
| Token creator | **50%** |
| Platform (Hood Desk treasury) | **30%** |
| Referrer / active bot creator | **20%** |

Fee rate: **1%** of simulated notional. Accrues on Trade fills into localStorage — **never claims mainnet payouts** until RH DEX + real fee routing.

### Gamification (light)

XP + level + Vienna daily streak + badges (First Trade, Creator, Follower, Streak 3). Hooks: connect, follow bot, simulate trade, publish bot, create project, write blog. XP chip in top nav / Trade sidebar.

### Weekly banner

Auto-rotates from seeded motivational lines by ISO week (Europe/Vienna). Override via Blog → Admin (`hood-desk:banner:override:v1`).

### Project storage

Projects persist in **localStorage** keyed by wallet address (lowercase) or `anon` if disconnected:

```
hood-desk:projects:<owner>
```

Shape (abbrev.): `{ id, name, ticker?, description, socials, logoUrl?, avatarEmoji?, agentPersona?, fairLaunch?, createdAt, updatedAt }`.

`fairLaunch`: `{ name, symbol, supply, decimals, status: draft|simulated|deployed, tokenAddress?, copy, lpChecklist[] }`.

### Fair launch

Every project token is labeled **Fair launch** only — mint-once, no team mint after deploy, no transfer tax. No unfair allocations UI.

Wizard steps: **Configure → Review → Deploy**

- **Local/demo**: writes a pending fair-launch record (`draft` / `simulated`) so UX is complete
- **Live**: `forge script` from `Desktop/hood-token` (see that README / `LAUNCH.md`); paste `tokenAddress` on the project (same idea as `VITE_HOOD_TOKEN`)
- **LP**: checklist TODO — do **not** invent DEX routers

## Agent skills (rule-based)

Persona: **Desk** / fox — witty, action-oriented, RH-only. No paid LLM.

Modular catalog in `src/lib/agent/skills.ts`. Chat **what can you do?** / **list skills** / **Skills** chip lists **all** skills.

Categories: wallet/chain · project/launchpad · market (honest DEX stubs) · social/business · ops · GM/Hood Street · meta.

## Out of scope

- Live browser deploy without user key ceremony
- Invented DEX routers / fake swap quotes
- Reading or printing `PRIVATE_KEY`
- Modifying hood-terminal / hoodquest / hood-token / gm-rh-miniapp

## Next steps / TODOs (real on-chain fees)

1. Deploy `$HOOD` from `hood-token` → set `VITE_HOOD_TOKEN` (and/or paste on a project)
2. Wire RH DEX when known (quote + swap; user signs) — **do not invent routers**
3. Replace demo rewards ledger with real fee routing: creator / treasury / referrer shares on-chain
4. Replace Revenue demo metrics with live treasury reads
5. Production Farcaster miniapp (`accountAssociation`, host URLs)
