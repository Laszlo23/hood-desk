/**
 * Hood Desk Stripe + Hoodstreet MCP helper — local Express on :8787
 *
 * Endpoints:
 *   POST /api/stripe/checkout          → create Checkout Session (mode: subscription)
 *   GET  /api/stripe/session/:id         → verify session (success page unlock)
 *   POST /api/stripe/webhook             → stub for checkout.session.completed
 *   GET  /api/health
 *
 *   GET  /api/hoodstreet/neon/:tokenId                    → get Neon TBA via MCP
 *   GET  /api/hoodstreet/neon/:tokenId/assets             → get Neon assets
 *   GET  /api/hoodstreet/neon/:tokenId/balances           → get Neon balances
 *   GET  /api/hoodstreet/neon/:tokenId/activity           → get Neon activity
 *   GET  /api/hoodstreet/neon/:tokenId/token/:tokenAddr   → get specific token balance
 *
 * Env (see ../.env.example):
 *   STRIPE_SECRET_KEY
 *   STRIPE_WEBHOOK_SECRET (optional for local)
 *   HOODSTREET_MCP_URL (default https://agent.hoodstreet.capital/mcp)
 *   PORT (default 8787)
 *   CORS_ORIGIN (default http://localhost:5182)
 */

import dotenv from 'dotenv'
import { fileURLToPath } from 'url'
import path from 'path'
import cors from 'cors'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
dotenv.config({ path: path.join(__dirname, '../.env') })
dotenv.config({ path: path.join(__dirname, '.env') }) // server/.env overrides
import express from 'express'
import Stripe from 'stripe'

const PORT = Number(process.env.PORT || 8787)
const CORS_ORIGIN = process.env.CORS_ORIGIN || 'http://localhost:5182'
const SECRET = (process.env.STRIPE_SECRET_KEY || '').trim()
const WEBHOOK_SECRET = (process.env.STRIPE_WEBHOOK_SECRET || '').trim()
const HOODSTREET_MCP_URL =
  (process.env.HOODSTREET_MCP_URL || '').trim() || 'https://agent.hoodstreet.capital/mcp'

const app = express()

app.use(
  cors({
    origin: [CORS_ORIGIN, 'http://127.0.0.1:5182', 'http://0.0.0.0:5182', 'http://localhost:5182'],
  }),
)

/** Health — no secrets */
app.get('/api/health', (_req, res) => {
  res.json({
    ok: true,
    stripe: Boolean(SECRET),
    hoodstreet: Boolean(HOODSTREET_MCP_URL),
    port: PORT,
    note: SECRET
      ? 'Stripe secret loaded'
      : 'Add STRIPE_SECRET_KEY to .env (never commit secrets)',
  })
})

/**
 * Hoodstreet MCP client — call MCP tools via JSON-RPC over HTTP POST.
 * Server: erc-6551-agent v0.2.0
 * Read-only tools for v1 (no prepare_*/confirm_*/execute_* write flows).
 */
let mcpRequestId = 1

async function callMcpTool(toolName, args = {}) {
  try {
    const response = await fetch(HOODSTREET_MCP_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        jsonrpc: '2.0',
        id: mcpRequestId++,
        method: 'tools/call',
        params: { name: toolName, arguments: args },
      }),
    })

    if (!response.ok) {
      throw new Error(`MCP HTTP ${response.status}`)
    }

    const data = await response.json()
    if (data.error) {
      throw new Error(data.error.message || 'MCP tool error')
    }

    return data.result
  } catch (err) {
    console.error(`[hoodstreet mcp] ${toolName} failed:`, err.message)
    throw err
  }
}

/** GET /api/hoodstreet/neon/:tokenId — resolve CCFF00 ERC-6551 TBA */
app.get('/api/hoodstreet/neon/:tokenId', async (req, res) => {
  try {
    const result = await callMcpTool('get_neon_wallet', { tokenId: req.params.tokenId })
    res.json({ ok: true, data: result })
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message })
  }
})

/** GET /api/hoodstreet/neon/:tokenId/assets?walletType=ccff00-erc6551 */
app.get('/api/hoodstreet/neon/:tokenId/assets', async (req, res) => {
  try {
    const walletType = req.query.walletType || 'ccff00-erc6551'
    const result = await callMcpTool('get_neon_assets', {
      tokenId: req.params.tokenId,
      walletType,
    })
    res.json({ ok: true, data: result })
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message })
  }
})

/** GET /api/hoodstreet/neon/:tokenId/balances?walletType=ccff00-erc6551 */
app.get('/api/hoodstreet/neon/:tokenId/balances', async (req, res) => {
  try {
    const walletType = req.query.walletType || 'ccff00-erc6551'
    const result = await callMcpTool('get_neon_balances', {
      tokenId: req.params.tokenId,
      walletType,
    })
    res.json({ ok: true, data: result })
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message })
  }
})

/** GET /api/hoodstreet/neon/:tokenId/activity?walletType=ccff00-erc6551 */
app.get('/api/hoodstreet/neon/:tokenId/activity', async (req, res) => {
  try {
    const walletType = req.query.walletType || 'ccff00-erc6551'
    const result = await callMcpTool('get_neon_activity', {
      tokenId: req.params.tokenId,
      walletType,
    })
    res.json({ ok: true, data: result })
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message })
  }
})

/** GET /api/hoodstreet/neon/:tokenId/token/:tokenAddress?walletType=ccff00-erc6551 */
app.get('/api/hoodstreet/neon/:tokenId/token/:tokenAddress', async (req, res) => {
  try {
    const walletType = req.query.walletType || 'ccff00-erc6551'
    const result = await callMcpTool('get_wallet_token', {
      tokenId: req.params.tokenId,
      walletType,
      tokenAddress: req.params.tokenAddress,
    })
    res.json({ ok: true, data: result })
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message })
  }
})

/**
 * Webhook stub — documents checkout.session.completed → entitlement.
 * For local: prefer GET /api/stripe/session/:id on the success page.
 * Raw body required for signature verification when secret is set.
 */
app.post('/api/stripe/webhook', express.raw({ type: 'application/json' }), (req, res) => {
  if (!SECRET) {
    return res.status(503).json({ error: 'STRIPE_SECRET_KEY missing' })
  }
  const stripe = new Stripe(SECRET)

  let event
  try {
    if (WEBHOOK_SECRET) {
      const sig = req.headers['stripe-signature']
      event = stripe.webhooks.constructEvent(req.body, sig, WEBHOOK_SECRET)
    } else {
      event = JSON.parse(req.body.toString('utf8'))
      console.warn('[stripe webhook] STRIPE_WEBHOOK_SECRET unset — accepting unsigned JSON (local only)')
    }
  } catch (err) {
    console.error('[stripe webhook]', err.message)
    return res.status(400).send(`Webhook Error: ${err.message}`)
  }

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object
    const tier = session.metadata?.tier || 'desk'
    console.log(
      `[stripe webhook] checkout.session.completed → set entitlement tier=${tier} customer=${session.customer} session=${session.id}`,
    )
    // Production: write entitlement to DB / fire push. Local unlock is via /session/:id.
  } else {
    console.log(`[stripe webhook] ignored type=${event.type}`)
  }

  res.json({ received: true })
})

app.use(express.json())

function requireStripe(res) {
  if (!SECRET) {
    res.status(503).json({
      error: 'Add Stripe keys — set STRIPE_SECRET_KEY in hood-desk/.env (see .env.example)',
    })
    return null
  }
  return new Stripe(SECRET)
}

const PAID = new Set(['starter', 'desk', 'desk_plus'])

/** Create Checkout Session (subscription mode) */
app.post('/api/stripe/checkout', async (req, res) => {
  const stripe = requireStripe(res)
  if (!stripe) return

  const { tier, priceId, successUrl, cancelUrl } = req.body || {}
  if (!PAID.has(tier)) {
    return res.status(400).json({ error: 'tier must be starter | desk | desk_plus' })
  }
  if (!priceId || typeof priceId !== 'string') {
    return res.status(400).json({ error: 'priceId required (VITE_STRIPE_PRICE_*)' })
  }
  if (!successUrl || !cancelUrl) {
    return res.status(400).json({ error: 'successUrl and cancelUrl required' })
  }

  try {
    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: successUrl,
      cancel_url: cancelUrl,
      metadata: { tier, product: 'hood-desk' },
      subscription_data: {
        metadata: { tier, product: 'hood-desk' },
      },
      allow_promotion_codes: true,
    })
    res.json({ sessionId: session.id, url: session.url })
  } catch (err) {
    console.error('[checkout]', err.message)
    res.status(400).json({ error: err.message || 'Checkout session failed' })
  }
})

/** Verify session after redirect — success page unlocks tier locally */
app.get('/api/stripe/session/:id', async (req, res) => {
  const stripe = requireStripe(res)
  if (!stripe) return

  try {
    const session = await stripe.checkout.sessions.retrieve(req.params.id)
    res.json({
      id: session.id,
      payment_status: session.payment_status,
      status: session.status,
      customer: typeof session.customer === 'string' ? session.customer : session.customer?.id || null,
      metadata: session.metadata || {},
      client_reference_id: session.client_reference_id,
    })
  } catch (err) {
    console.error('[session]', err.message)
    res.status(400).json({ error: err.message || 'Session lookup failed' })
  }
})

app.listen(PORT, '0.0.0.0', () => {
  console.log(`[hood-desk stripe] http://0.0.0.0:${PORT}  secret=${SECRET ? 'yes' : 'NO — demo only'}`)
})
