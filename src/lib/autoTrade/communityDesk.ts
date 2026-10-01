/**
 * Community Auto-Trade — HOOD agent paper/demo desk for the pack.
 * All fills are local SIMULATED. No DEX router, no live swaps, no fake on-chain vault.
 */

export type RiskLevel = 'calm' | 'balanced' | 'spicy'
export type ScheduleId = 'hourly' | '4h' | 'daily'

export type StrategyId =
  | 'dca_pool'
  | 'momentum_scout'
  | 'risk_off'
  | 'dogihood_pride'

export type StrategyDef = {
  id: StrategyId
  name: string
  blurb: string
  /** Flavor-only strategies never place size — they boost narrative / holder pride */
  flavorOnly?: boolean
  /** Desk-tier UI gate (demo still runnable without Stripe) */
  deskGated?: boolean
  pairs: string[]
  voice: string
}

export type StrategyState = {
  enabled: boolean
  allocationPct: number
}

export type CommunityDeskSettings = {
  masterEnabled: boolean
  risk: RiskLevel
  schedule: ScheduleId
  strategies: Record<StrategyId, StrategyState>
  /** Last engine tick ISO */
  lastTickAt: string | null
}

export type AgentActionKind = 'scan' | 'buy' | 'sell' | 'pause' | 'boost' | 'note'

export type AgentAction = {
  id: string
  at: string
  strategyId: StrategyId
  strategyName: string
  kind: AgentActionKind
  pair: string
  size: string
  reason: string
  voice: string
  /** Always true for this module */
  simulated: true
}

export type VaultEntry = {
  id: string
  at: string
  label: string
  /** Signed demo PnL in abstract vault units */
  delta: number
  pair?: string
  strategyId?: StrategyId
}

export type VaultLedger = {
  /** Starting demo pool */
  base: number
  entries: VaultEntry[]
}

const SETTINGS_KEY = 'hood-desk:community-autotrade:settings:v1'
const FEED_KEY = 'hood-desk:community-autotrade:feed:v1'
const VAULT_KEY = 'hood-desk:community-autotrade:vault:v1'

export const STRATEGIES: StrategyDef[] = [
  {
    id: 'dca_pool',
    name: 'DCA Community Pool',
    blurb: 'Steady paper buys into the shared HOOD/ETH demo pool — calm pack accumulation.',
    pairs: ['HOOD/ETH', 'NEON/USDC'],
    voice: 'HOOD here — drip-feeding the community pool. SIM only.',
  },
  {
    id: 'momentum_scout',
    name: 'Momentum Scout',
    blurb: 'Scouts RH 4663 demo movers and sizes paper entries when momentum flips green.',
    deskGated: true,
    pairs: ['FOX/ETH', 'HOOD/ETH', 'NEON/USDC'],
    voice: 'HOOD scanning RH 4663 — momentum ping. Paper size only.',
  },
  {
    id: 'risk_off',
    name: 'Risk-Off Pause',
    blurb: 'Cuts paper risk when demo vol spikes — protects the shared vault narrative.',
    deskGated: true,
    pairs: ['HOOD/ETH', 'ALL'],
    voice: 'HOOD risk-off — pausing spicy size. Community first.',
  },
  {
    id: 'dogihood_pride',
    name: 'DogiHood Pride Boost',
    blurb: 'Flavor only — celebrates DogiHood holders with pack pride pings. No trade size.',
    flavorOnly: true,
    pairs: ['DogiHood'],
    voice: 'HOOD pack pride — DogiHood holders, we see you. 🐕',
  },
]

const DEFAULT_STRATEGIES: Record<StrategyId, StrategyState> = {
  dca_pool: { enabled: true, allocationPct: 40 },
  momentum_scout: { enabled: false, allocationPct: 25 },
  risk_off: { enabled: true, allocationPct: 15 },
  dogihood_pride: { enabled: true, allocationPct: 0 },
}

const DEFAULT_SETTINGS: CommunityDeskSettings = {
  masterEnabled: true,
  risk: 'balanced',
  schedule: '4h',
  strategies: { ...DEFAULT_STRATEGIES },
  lastTickAt: null,
}

const VAULT_BASE = 10_000

function readJson<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key)
    if (!raw) return fallback
    return JSON.parse(raw) as T
  } catch {
    return fallback
  }
}

function writeJson(key: string, value: unknown): void {
  localStorage.setItem(key, JSON.stringify(value))
}

export function getStrategyDef(id: StrategyId): StrategyDef {
  return STRATEGIES.find((s) => s.id === id) ?? STRATEGIES[0]
}

export function loadSettings(): CommunityDeskSettings {
  const raw = readJson<Partial<CommunityDeskSettings> | null>(SETTINGS_KEY, null)
  if (!raw) return { ...DEFAULT_SETTINGS, strategies: { ...DEFAULT_STRATEGIES } }
  return {
    masterEnabled: raw.masterEnabled ?? true,
    risk: raw.risk ?? 'balanced',
    schedule: raw.schedule ?? '4h',
    lastTickAt: raw.lastTickAt ?? null,
    strategies: {
      ...DEFAULT_STRATEGIES,
      ...(raw.strategies ?? {}),
    },
  }
}

export function saveSettings(next: CommunityDeskSettings): void {
  writeJson(SETTINGS_KEY, next)
}

export function updateSettings(
  patch: Partial<Omit<CommunityDeskSettings, 'strategies'>> & {
    strategies?: Partial<Record<StrategyId, Partial<StrategyState>>>
  },
): CommunityDeskSettings {
  const cur = loadSettings()
  const strategies = { ...cur.strategies }
  if (patch.strategies) {
    for (const id of Object.keys(patch.strategies) as StrategyId[]) {
      strategies[id] = { ...strategies[id], ...patch.strategies[id]! }
    }
  }
  const next: CommunityDeskSettings = {
    masterEnabled: patch.masterEnabled ?? cur.masterEnabled,
    risk: patch.risk ?? cur.risk,
    schedule: patch.schedule ?? cur.schedule,
    lastTickAt: patch.lastTickAt !== undefined ? patch.lastTickAt : cur.lastTickAt,
    strategies,
  }
  saveSettings(next)
  return next
}

export function listActions(limit = 40): AgentAction[] {
  const all = readJson<AgentAction[]>(FEED_KEY, [])
  return all.slice(0, limit)
}

export function loadVault(): VaultLedger {
  const raw = readJson<VaultLedger | null>(VAULT_KEY, null)
  if (!raw || !Array.isArray(raw.entries)) {
    return { base: VAULT_BASE, entries: [] }
  }
  return { base: raw.base || VAULT_BASE, entries: raw.entries.slice(0, 80) }
}

export function vaultTotals(ledger?: VaultLedger): {
  base: number
  pnl: number
  equity: number
  trades: number
} {
  const v = ledger ?? loadVault()
  const pnl = v.entries.reduce((s, e) => s + e.delta, 0)
  return { base: v.base, pnl, equity: v.base + pnl, trades: v.entries.length }
}

/** Retired. The desk does not invent agent trades. */
export function ensureSeedFeed(): AgentAction[] {
  return []
}

export function tickCommunityDesk(_force = false): {
  actions: AgentAction[]
  settings: CommunityDeskSettings
} {
  return { actions: [], settings: loadSettings() }
}

export function clearCommunityDeskDemo(): void {
  localStorage.removeItem(FEED_KEY)
  localStorage.removeItem(VAULT_KEY)
}

export function scheduleMs(id: ScheduleId): number {
  if (id === 'hourly') return 60 * 60_000
  if (id === 'daily') return 24 * 60 * 60_000
  return 4 * 60 * 60_000
}

export function maybeAutoTick(): AgentAction[] {
  return []
}

export const HOOD_AGENT_STATUS = {
  online: true,
  desk: 'COMMUNITY DESK',
  mode: 'LIVE',
  chain: 'RH 4663',
} as const
