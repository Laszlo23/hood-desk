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
import { createNightDesk } from './nightDesk.js'
import { createBuilders } from './builders.js'

const PORT = Number(process.env.PORT || 8787)
const HOST = process.env.HOST || '0.0.0.0'
const CORS_ORIGIN = process.env.CORS_ORIGIN || 'http://localhost:5182'
const SECRET = (process.env.STRIPE_SECRET_KEY || '').trim()
const WEBHOOK_SECRET = (process.env.STRIPE_WEBHOOK_SECRET || '').trim()
const HOODSTREET_MCP_URL =
  (process.env.HOODSTREET_MCP_URL || '').trim() || 'https://agent.hoodstreet.capital/mcp'

const app = express()

const hits = new Map()

function clientIp(req) {
  const forwarded = req.headers['x-forwarded-for']
  if (typeof forwarded === 'string' && forwarded.trim()) return forwarded.split(',')[0].trim()
  return req.socket.remoteAddress || 'unknown'
}

function tooFast(key, limit, windowMs) {
  const now = Date.now()
  const fresh = (hits.get(key) || []).filter((at) => now - at < windowMs)
  if (fresh.length >= limit) {
    hits.set(key, fresh)
    return true
  }
  fresh.push(now)
  hits.set(key, fresh)
  return false
}

function publicError(_req, res, status, message) {
  res.status(status).json({ ok: false, error: message })
}

function neonTokenId(raw) {
  return /^\d{1,8}$/.test(String(raw || ''))
}

function neonWalletType(raw) {
  const value = String(raw || 'ccff00-erc6551')
  return value === 'ccff00-erc6551' ? value : null
}

function ethAddress(raw) {
  return /^0x[a-fA-F0-9]{40}$/.test(String(raw || ''))
}

app.use(
  cors({
    origin: [
      CORS_ORIGIN,
      'https://doghood.aibusiness.fun',
      'http://127.0.0.1:5182',
      'http://0.0.0.0:5182',
      'http://localhost:5182',
    ],
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
 * Read-only tools for v1 (no prepare_/confirm_/execute_ write flows).
 */
let mcpRequestId = 1

async function callMcpTool(toolName, args = {}) {
  try {
    const response = await fetch(HOODSTREET_MCP_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json, text/event-stream',
      },
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

    // MCP over HTTP POST returns SSE format, need to parse event stream
    const text = await response.text()
    
    // Parse SSE format: "event: message\ndata: {json}\n\n"
    const dataMatch = text.match(/data: (.+)/s)
    if (!dataMatch) {
      throw new Error('Invalid MCP SSE response format')
    }
    
    const data = JSON.parse(dataMatch[1])
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
  if (tooFast(`neon:${clientIp(req)}`, 40, 10 * 60 * 1000)) {
    return publicError(req, res, 429, 'Too many reads. Wait a moment.')
  }
  if (!neonTokenId(req.params.tokenId)) {
    return publicError(req, res, 400, 'Token id must be a number.')
  }
  try {
    const result = await callMcpTool('get_neon_wallet', { tokenId: req.params.tokenId })
    res.json({ ok: true, data: result })
  } catch (err) {
    console.error('[neon]', err.message)
    publicError(req, res, 502, 'That wallet read failed.')
  }
})

/** GET /api/hoodstreet/neon/:tokenId/assets?walletType=ccff00-erc6551 */
app.get('/api/hoodstreet/neon/:tokenId/assets', async (req, res) => {
  if (!neonTokenId(req.params.tokenId)) return publicError(req, res, 400, 'Token id must be a number.')
  const walletType = neonWalletType(req.query.walletType)
  if (!walletType) return publicError(req, res, 400, 'Unknown wallet type.')
  try {
    const result = await callMcpTool('get_neon_assets', { tokenId: req.params.tokenId, walletType })
    res.json({ ok: true, data: result })
  } catch (err) {
    console.error('[neon assets]', err.message)
    publicError(req, res, 502, 'That wallet read failed.')
  }
})

/** GET /api/hoodstreet/neon/:tokenId/balances?walletType=ccff00-erc6551 */
app.get('/api/hoodstreet/neon/:tokenId/balances', async (req, res) => {
  if (!neonTokenId(req.params.tokenId)) return publicError(req, res, 400, 'Token id must be a number.')
  const walletType = neonWalletType(req.query.walletType)
  if (!walletType) return publicError(req, res, 400, 'Unknown wallet type.')
  try {
    const result = await callMcpTool('get_neon_balances', { tokenId: req.params.tokenId, walletType })
    res.json({ ok: true, data: result })
  } catch (err) {
    console.error('[neon balances]', err.message)
    publicError(req, res, 502, 'That wallet read failed.')
  }
})

/** GET /api/hoodstreet/neon/:tokenId/activity?walletType=ccff00-erc6551 */
app.get('/api/hoodstreet/neon/:tokenId/activity', async (req, res) => {
  if (!neonTokenId(req.params.tokenId)) return publicError(req, res, 400, 'Token id must be a number.')
  const walletType = neonWalletType(req.query.walletType)
  if (!walletType) return publicError(req, res, 400, 'Unknown wallet type.')
  try {
    const result = await callMcpTool('get_neon_activity', { tokenId: req.params.tokenId, walletType })
    res.json({ ok: true, data: result })
  } catch (err) {
    console.error('[neon activity]', err.message)
    publicError(req, res, 502, 'That wallet read failed.')
  }
})

/** GET /api/hoodstreet/neon/:tokenId/token/:tokenAddress?walletType=ccff00-erc6551 */
app.get('/api/hoodstreet/neon/:tokenId/token/:tokenAddress', async (req, res) => {
  if (!neonTokenId(req.params.tokenId)) return publicError(req, res, 400, 'Token id must be a number.')
  if (!ethAddress(req.params.tokenAddress)) return publicError(req, res, 400, 'Token address is not valid.')
  const walletType = neonWalletType(req.query.walletType)
  if (!walletType) return publicError(req, res, 400, 'Unknown wallet type.')
  try {
    const result = await callMcpTool('get_wallet_token', {
      tokenId: req.params.tokenId,
      walletType,
      tokenAddress: req.params.tokenAddress,
    })
    res.json({ ok: true, data: result })
  } catch (err) {
    console.error('[neon token]', err.message)
    publicError(req, res, 502, 'That wallet read failed.')
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
    if (!WEBHOOK_SECRET) {
      return res.status(503).json({ error: 'Webhook secret is not configured' })
    }
    const sig = req.headers['stripe-signature']
    event = stripe.webhooks.constructEvent(req.body, sig, WEBHOOK_SECRET)
  } catch (err) {
    console.error('[stripe webhook]', err.message)
    return res.status(400).json({ error: 'Webhook signature did not match' })
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

app.use(express.json({ limit: '32kb' }))

const nightDesk = createNightDesk(path.join(__dirname, 'data', 'night-desk.json'))
const builders = createBuilders(path.join(__dirname, 'data', 'builders.json'))

app.get('/api/builders', (_req, res) => {
  res.json({ ok: true, ...builders.snapshot() })
})

app.post('/api/builders', (req, res) => {
  if (tooFast(`build:${clientIp(req)}`, 6, 10 * 60 * 1000)) {
    return publicError(req, res, 429, 'Too many listings. Wait a moment.')
  }
  const saved = builders.submit(req.body || {})
  if (saved.error) return publicError(req, res, 400, saved.error)
  res.json({ ok: true, ...saved })
})

app.get('/api/night', (_req, res) => {
  res.json({ ok: true, ...nightDesk.snapshot() })
})

app.post('/api/night', (req, res) => {
  if (tooFast(`night:${clientIp(req)}`, 30, 10 * 60 * 1000)) {
    return publicError(req, res, 429, 'Too many runs. Wait a moment.')
  }
  const saved = nightDesk.submit(req.body || {})
  if (saved.error) return publicError(req, res, 400, saved.error)
  res.json({ ok: true, ...saved })
})

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

function priceForTier(tier) {
  const map = {
    starter: process.env.STRIPE_PRICE_STARTER || process.env.VITE_STRIPE_PRICE_STARTER,
    desk: process.env.STRIPE_PRICE_DESK || process.env.VITE_STRIPE_PRICE_DESK,
    desk_plus: process.env.STRIPE_PRICE_DESK_PLUS || process.env.VITE_STRIPE_PRICE_DESK_PLUS,
  }
  return String(map[tier] || '').trim()
}

function allowedReturnUrl(raw) {
  if (typeof raw !== 'string' || raw.length > 500) return false
  let url
  try {
    url = new URL(raw)
  } catch {
    return false
  }
  const host = url.host
  if (host === 'doghood.aibusiness.fun') return url.protocol === 'https:'
  if (
    host === 'localhost:5182' ||
    host === '127.0.0.1:5182' ||
    host === 'localhost:4000' ||
    host === '127.0.0.1:4000'
  ) {
    return url.protocol === 'http:'
  }
  return false
}

/** Create Checkout Session (subscription mode) */
app.post('/api/stripe/checkout', async (req, res) => {
  const stripe = requireStripe(res)
  if (!stripe) return

  if (tooFast(`checkout:${clientIp(req)}`, 8, 10 * 60 * 1000)) {
    return res.status(429).json({ error: 'Too many checkouts. Wait a moment.' })
  }

  const { tier, successUrl, cancelUrl } = req.body || {}
  if (!PAID.has(tier)) {
    return res.status(400).json({ error: 'tier must be starter | desk | desk_plus' })
  }
  const priceId = priceForTier(tier)
  if (!priceId) {
    return res.status(503).json({ error: 'Stripe price for this plan is not configured' })
  }
  if (!allowedReturnUrl(successUrl) || !allowedReturnUrl(cancelUrl)) {
    return res.status(400).json({ error: 'Return URL must be this desk' })
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
    res.status(400).json({ error: 'Checkout did not open.' })
  }
})

/** Verify session after redirect — success page unlocks tier locally */
app.get('/api/stripe/session/:id', async (req, res) => {
  const stripe = requireStripe(res)
  if (!stripe) return

  if (!/^cs_(test|live)_[A-Za-z0-9]{8,}$/.test(String(req.params.id || '')) || String(req.params.id).length > 120) {
    return res.status(400).json({ error: 'Checkout session id is not valid.' })
  }
  if (tooFast(`session:${clientIp(req)}`, 30, 10 * 60 * 1000)) {
    return res.status(429).json({ error: 'Too many lookups. Wait a moment.' })
  }

  try {
    const session = await stripe.checkout.sessions.retrieve(req.params.id)
    if (session.metadata?.product !== 'hood-desk') {
      return res.status(404).json({ error: 'Session is not a Hood Desk checkout' })
    }
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
    res.status(400).json({ error: 'Checkout session was not found.' })
  }
})

app.listen(PORT, HOST, () => {
  console.log(`[hood-desk stripe] http://${HOST}:${PORT}  secret=${SECRET ? 'yes' : 'NO — demo only'}`)
})
