/**
 * Hood Desk subscriptions — cheap automated trading + deployer agents.
 * Entitlements in localStorage (`hood-desk:sub:v1`).
 * Stripe Checkout when keys exist; demo activate otherwise.
 */

const KEY = 'hood-desk:sub:v1'

export type SubTier = 'free' | 'starter' | 'desk' | 'desk_plus'

export type SubscriptionState = {
  tier: SubTier
  /** ISO timestamp when plan was activated */
  activatedAt: string | null
  /** Display label last chosen */
  label: string
  /** Product updates covered until (Desk / Desk+) — ISO date */
  updatesUntil: string | null
  stripeCustomerId?: string | null
  stripeSessionId?: string | null
}

export type TierDef = {
  id: SubTier
  name: string
  /** Display monthly price string e.g. "$4.99/mo" */
  price: string
  /** Numeric USD for docs / Stripe matching */
  priceUsd: number
  tagline: string
  perks: string[]
  highlight?: boolean
  /** Paid tier eligible for Stripe Checkout */
  paid?: boolean
}

function envPrice(key: string, fallback: number): number {
  try {
    const env = import.meta.env as Record<string, string | undefined>
    const raw = String(env[key] ?? '').trim()
    const n = Number(raw)
    return Number.isFinite(n) && n > 0 ? n : fallback
  } catch {
    return fallback
  }
}

const PRICE_STARTER = envPrice('VITE_PRICE_STARTER', 4.99)
const PRICE_DESK = envPrice('VITE_PRICE_DESK', 9.99)
const PRICE_DESK_PLUS = envPrice('VITE_PRICE_DESK_PLUS', 19.99)

function fmtMo(n: number): string {
  return `$${n.toFixed(2).replace(/\.00$/, '')}/mo`
}

export const TIERS: TierDef[] = [
  {
    id: 'free',
    name: 'Free',
    price: '$0',
    priceUsd: 0,
    tagline: 'Browse the desk — simulate before you scale',
    perks: [
      'Trade simulate (DCA/TWAP demo)',
      'Browse Skill Market',
      '1 published bot',
      'Follow up to 3 bots',
    ],
  },
  {
    id: 'starter',
    name: 'Starter',
    price: fmtMo(PRICE_STARTER),
    priceUsd: PRICE_STARTER,
    paid: true,
    tagline: 'Auto-trade skills + 1 deployer agent',
    perks: [
      'Auto-trade skills (DCA/TWAP simulate → live when DEX ready)',
      '1 deployer agent slot',
      'Basic social growth tips (X / Farcaster)',
      'Follow up to 5 bots',
      '+10% XP boost',
    ],
  },
  {
    id: 'desk',
    name: 'Desk',
    price: fmtMo(PRICE_DESK),
    priceUsd: PRICE_DESK,
    paid: true,
    highlight: true,
    tagline: 'Full trading + deployer agents · 6 mo updates',
    perks: [
      'Full automated trading agents',
      'Token deployer agents (multi-slot)',
      'Social media growth pack (X / Farcaster playbooks)',
      'Constant product updates for 6 months',
      'Featured Skill Market badge',
      'Up to 5 published bots · 12 follow slots',
      '+25% XP boost',
    ],
  },
  {
    id: 'desk_plus',
    name: 'Desk+',
    price: fmtMo(PRICE_DESK_PLUS),
    priceUsd: PRICE_DESK_PLUS,
    paid: true,
    tagline: 'Priority deploy · unlimited follows · multi-agent',
    perks: [
      'Everything in Desk',
      'Priority deploy queue (stub)',
      'Unlimited bot follows + multi-agent',
      'Unlimited published bots',
      'Higher XP (+50%)',
      'Social growth + 6 months continuous updates',
    ],
  },
]

const DEFAULT: SubscriptionState = {
  tier: 'free',
  activatedAt: null,
  label: 'Free',
  updatesUntil: null,
  stripeCustomerId: null,
  stripeSessionId: null,
}

function normalizeTier(raw: unknown): SubTier {
  if (raw === 'starter') return 'starter'
  if (raw === 'desk' || raw === 'pro') return 'desk' // migrate legacy "pro"
  if (raw === 'desk_plus') return 'desk_plus'
  return 'free'
}

function plusSixMonths(from = new Date()): string {
  const d = new Date(from)
  d.setMonth(d.getMonth() + 6)
  return d.toISOString()
}

function read(): SubscriptionState {
  try {
    const raw = localStorage.getItem(KEY)
    if (!raw) return { ...DEFAULT }
    const parsed = JSON.parse(raw) as Partial<SubscriptionState> & { tier?: string }
    const tier = normalizeTier(parsed.tier)
    const label =
      parsed.label || TIERS.find((t) => t.id === tier)?.name || 'Free'
    return {
      tier,
      activatedAt: parsed.activatedAt ?? null,
      label: tier === 'desk' && parsed.label === 'Pro' ? 'Desk' : label,
      updatesUntil: parsed.updatesUntil ?? null,
      stripeCustomerId: parsed.stripeCustomerId ?? null,
      stripeSessionId: parsed.stripeSessionId ?? null,
    }
  } catch {
    return { ...DEFAULT }
  }
}

function write(state: SubscriptionState): void {
  localStorage.setItem(KEY, JSON.stringify(state))
}

export function getSubscription(): SubscriptionState {
  return read()
}

export function getTier(): SubTier {
  return read().tier
}

/** Desk or Desk+ (paid mid/high) — featured + full agents */
export function isDeskOrHigher(): boolean {
  const t = getTier()
  return t === 'desk' || t === 'desk_plus'
}

/** @deprecated use isDeskOrHigher — kept for Skill Market callers */
export function isProOrHigher(): boolean {
  return isDeskOrHigher() || getTier() === 'starter'
}

export function isDeskPlus(): boolean {
  return getTier() === 'desk_plus'
}

export function hasUpdatesCoverage(): boolean {
  const u = read().updatesUntil
  if (!u) return false
  return new Date(u).getTime() > Date.now()
}

export function formatUpdatesUntil(iso: string | null | undefined): string | null {
  if (!iso) return null
  try {
    return new Date(iso).toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    })
  } catch {
    return null
  }
}

/** Max user-published bots / deployer agent slots on current plan. */
export function maxPublishedBots(): number {
  const t = getTier()
  if (t === 'desk_plus') return Infinity
  if (t === 'desk') return 5
  if (t === 'starter') return 1
  return 1
}

/** Max followed bots (priority follow slots). */
export function maxFollowSlots(): number {
  const t = getTier()
  if (t === 'desk_plus') return Infinity
  if (t === 'desk') return 12
  if (t === 'starter') return 5
  return 3
}

/** XP multiplier for gamification awards. */
export function xpBoostMultiplier(): number {
  const t = getTier()
  if (t === 'desk_plus') return 1.5
  if (t === 'desk') return 1.25
  if (t === 'starter') return 1.1
  return 1
}

export function canUseFeaturedBadge(): boolean {
  return isDeskOrHigher()
}

export type ActivateOpts = {
  stripeCustomerId?: string | null
  stripeSessionId?: string | null
  /** Override updatesUntil; default +6mo for desk / desk_plus */
  updatesUntil?: string | null
}

export function activateTier(tier: SubTier, opts: ActivateOpts = {}): SubscriptionState {
  const def = TIERS.find((t) => t.id === tier) ?? TIERS[0]
  const now = new Date()
  const grantUpdates = tier === 'desk' || tier === 'desk_plus'
  const next: SubscriptionState = {
    tier,
    activatedAt: now.toISOString(),
    label: def.name,
    updatesUntil:
      opts.updatesUntil !== undefined
        ? opts.updatesUntil
        : grantUpdates
          ? plusSixMonths(now)
          : null,
    stripeCustomerId: opts.stripeCustomerId ?? read().stripeCustomerId ?? null,
    stripeSessionId: opts.stripeSessionId ?? null,
  }
  write(next)
  return next
}

export function downgradeToFree(): SubscriptionState {
  const next: SubscriptionState = {
    tier: 'free',
    activatedAt: new Date().toISOString(),
    label: 'Free',
    updatesUntil: null,
    stripeCustomerId: read().stripeCustomerId ?? null,
    stripeSessionId: null,
  }
  write(next)
  return next
}

/** Count non-demo bots owned by wallet (or all local if no wallet). */
export function countOwnedPublishedBots(
  bots: { isDemo?: boolean; authorWallet?: string }[],
  wallet?: string,
): number {
  const mine = bots.filter((b) => !b.isDemo)
  if (!wallet) return mine.length
  const w = wallet.toLowerCase()
  return mine.filter((b) => b.authorWallet?.toLowerCase() === w).length
}
