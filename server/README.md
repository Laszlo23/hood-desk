# Hood Desk Stripe server (local)

Minimal Express on **:8787** for Checkout Sessions + session verify + webhook stub.

## Quick start

```bash
cd /Users/poker.vibe/Desktop/hood-desk
cp .env.example .env   # fill Stripe keys — never commit .env
cd server && npm install && npm start
```

From repo root you can also: `npm run server` (after root + server install).

Vite proxies `/api` → `http://127.0.0.1:8787`.

## Stripe Dashboard — create Products / Prices

1. Open [Stripe Dashboard → Products](https://dashboard.stripe.com/products)
2. Create three **recurring monthly** products matching Hood Desk tiers:

| Product name | Price (USD/mo) | Copy into `.env` |
| --- | --- | --- |
| Hood Desk Starter | **4.99** | `VITE_STRIPE_PRICE_STARTER=price_…` |
| Hood Desk Desk | **9.99** | `VITE_STRIPE_PRICE_DESK=price_…` |
| Hood Desk Desk+ | **19.99** | `VITE_STRIPE_PRICE_DESK_PLUS=price_…` |

3. Copy **Publishable key** → `VITE_STRIPE_PUBLISHABLE_KEY=pk_test_…`
4. Copy **Secret key** → `STRIPE_SECRET_KEY=sk_test_…` (server only — never `VITE_`)
5. (Optional) Webhooks → endpoint `http://localhost:8787/api/stripe/webhook` → event `checkout.session.completed` → `STRIPE_WEBHOOK_SECRET=whsec_…`

Use **Test mode** until go-live.

## Local entitlement flow

1. User clicks **Subscribe with Stripe** on `#/subscribe`
2. `POST /api/stripe/checkout` creates a Session (`mode: subscription`)
3. Stripe redirects to `#/subscribe?success=1&session_id=cs_…`
4. Frontend calls `GET /api/stripe/session/:id` and unlocks tier + `updatesUntil` (+6 months for Desk / Desk+)

Webhook stub logs `checkout.session.completed` for production wiring; local unlock does not require it.
