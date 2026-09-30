/**
 * Frontend Stripe helpers — Checkout redirect via local Express (:8787).
 * Never embeds secret keys; publishable key + price IDs only.
 */

import { loadStripe, type Stripe } from '@stripe/stripe-js'
import type { SubTier } from '../subscription'

const API_BASE = (import.meta.env.VITE_STRIPE_API_BASE as string | undefined)?.trim() || '/api'

export type PaidTier = Exclude<SubTier, 'free'>

export function getPublishableKey(): string {
  return String(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY || '').trim()
}

export function getPriceId(tier: PaidTier): string {
  const map: Record<PaidTier, string> = {
    starter: String(import.meta.env.VITE_STRIPE_PRICE_STARTER || '').trim(),
    desk: String(import.meta.env.VITE_STRIPE_PRICE_DESK || '').trim(),
    desk_plus: String(import.meta.env.VITE_STRIPE_PRICE_DESK_PLUS || '').trim(),
  }
  return map[tier]
}

/** True when publishable key + all three price IDs are present. */
export function stripeConfigured(): boolean {
  if (!getPublishableKey()) return false
  return (['starter', 'desk', 'desk_plus'] as PaidTier[]).every((t) => Boolean(getPriceId(t)))
}

let stripePromise: Promise<Stripe | null> | null = null

export function getStripe(): Promise<Stripe | null> {
  const key = getPublishableKey()
  if (!key) return Promise.resolve(null)
  if (!stripePromise) stripePromise = loadStripe(key)
  return stripePromise
}

export type CheckoutSessionResult = {
  sessionId: string
  url: string | null
}

export async function createCheckoutSession(tier: PaidTier): Promise<CheckoutSessionResult> {
  const priceId = getPriceId(tier)
  if (!priceId) throw new Error(`Missing Stripe price id for ${tier}`)

  const successUrl = `${window.location.origin}${window.location.pathname}#/subscribe?success=1&session_id={CHECKOUT_SESSION_ID}`
  const cancelUrl = `${window.location.origin}${window.location.pathname}#/subscribe?canceled=1`

  const res = await fetch(`${API_BASE}/stripe/checkout`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ tier, priceId, successUrl, cancelUrl }),
  })

  if (!res.ok) {
    const body = (await res.json().catch(() => ({}))) as { error?: string }
    throw new Error(body.error || `Checkout failed (${res.status})`)
  }

  return (await res.json()) as CheckoutSessionResult
}

export type SessionVerify = {
  id: string
  payment_status: string
  status: string
  customer: string | null
  metadata: { tier?: string }
  client_reference_id?: string | null
}

export async function verifyCheckoutSession(sessionId: string): Promise<SessionVerify> {
  const res = await fetch(`${API_BASE}/stripe/session/${encodeURIComponent(sessionId)}`)
  if (!res.ok) {
    const body = (await res.json().catch(() => ({}))) as { error?: string }
    throw new Error(body.error || `Session verify failed (${res.status})`)
  }
  return (await res.json()) as SessionVerify
}

export async function redirectToCheckout(tier: PaidTier): Promise<void> {
  const { sessionId, url } = await createCheckoutSession(tier)
  if (url) {
    window.location.href = url
    return
  }
  const stripe = await getStripe()
  if (!stripe) throw new Error('Stripe.js failed to load')
  const { error } = await stripe.redirectToCheckout({ sessionId })
  if (error) throw new Error(error.message)
}
