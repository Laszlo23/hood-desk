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

function uid(prefix: string): string {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`
}

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

function pushActions(items: AgentAction[]): void {
  const all = readJson<AgentAction[]>(FEED_KEY, [])
  writeJson(FEED_KEY, [...items, ...all].slice(0, 120))
}

export function loadVault(): VaultLedger {
  const raw = readJson<VaultLedger | null>(VAULT_KEY, null)
  if (!raw || !Array.isArray(raw.entries)) {
    return { base: VAULT_BASE, entries: [] }
  }
  return { base: raw.base || VAULT_BASE, entries: raw.entries.slice(0, 80) }
}

function pushVault(entry: VaultEntry): void {
  const v = loadVault()
  v.entries.unshift(entry)
  writeJson(VAULT_KEY, { base: v.base, entries: v.entries.slice(0, 80) })
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

const RISK_MULT: Record<RiskLevel, number> = {
  calm: 0.55,
  balanced: 1,
  spicy: 1.55,
}

const SIZE_POOL = [42, 88, 120, 210, 340, 500, 720]

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)]!
}

function sizeFor(risk: RiskLevel, allocPct: number): string {
  const base = pick(SIZE_POOL)
  const n = Math.max(12, Math.round(base * RISK_MULT[risk] * (allocPct / 40)))
  return `${n} (SIM)`
}

function reasonFor(def: StrategyDef, kind: AgentActionKind, pair: string): string {
  switch (def.id) {
    case 'dca_pool':
      return kind === 'buy'
        ? `Scheduled DCA slice into ${pair} community pool`
        : `DCA scout pass on ${pair}`
    case 'momentum_scout':
      return kind === 'buy'
        ? `Momentum flip green on ${pair} — paper entry`
        : kind === 'sell'
          ? `Fade after demo spike on ${pair}`
          : `Scanning ${pair} momentum bands`
    case 'risk_off':
      return kind === 'pause'
        ? `Vol spike — pausing spicy size across desk`
        : `Risk check clear on ${pair}`
    case 'dogihood_pride':
      return `Pack pride ping — DogiHood holders get the boost (flavor only)`
    default:
      return `${def.name} action on ${pair}`
  }
}

/** Seed a few honest SIM actions so the feed never feels empty on first visit. */
export function ensureSeedFeed(): AgentAction[] {
  const existing = listActions(5)
  if (existing.length > 0) return listActions()

  const now = Date.now()
  const seeds: AgentAction[] = [
    {
      id: uid('sim_act'),
      at: new Date(now - 12 * 60_000).toISOString(),
      strategyId: 'dca_pool',
      strategyName: 'DCA Community Pool',
      kind: 'buy',
      pair: 'HOOD/ETH',
      size: '120 (SIM)',
      reason: 'Scheduled DCA slice into HOOD/ETH community pool',
      voice: 'HOOD here — drip-feeding the community pool. SIM only.',
      simulated: true,
    },
    {
      id: uid('sim_act'),
      at: new Date(now - 28 * 60_000).toISOString(),
      strategyId: 'momentum_scout',
      strategyName: 'Momentum Scout',
      kind: 'scan',
      pair: 'FOX/ETH',
      size: '—',
      reason: 'Scanning FOX/ETH momentum bands',
      voice: 'HOOD scanning RH 4663 — momentum ping. Paper size only.',
      simulated: true,
    },
    {
      id: uid('sim_act'),
      at: new Date(now - 45 * 60_000).toISOString(),
      strategyId: 'dogihood_pride',
      strategyName: 'DogiHood Pride Boost',
      kind: 'boost',
      pair: 'DogiHood',
      size: 'flavor',
      reason: 'Pack pride ping — DogiHood holders get the boost (flavor only)',
      voice: 'HOOD pack pride — DogiHood holders, we see you. 🐕',
      simulated: true,
    },
    {
      id: uid('sim_act'),
      at: new Date(now - 70 * 60_000).toISOString(),
      strategyId: 'risk_off',
      strategyName: 'Risk-Off Pause',
      kind: 'note',
      pair: 'ALL',
      size: '—',
      reason: 'Risk check clear on ALL',
      voice: 'HOOD risk-off — pausing spicy size. Community first.',
      simulated: true,
    },
  ]
  pushActions(seeds)

  if (loadVault().entries.length === 0) {
    pushVault({
      id: uid('vault'),
      at: seeds[0]!.at,
      label: 'SIM DCA buy HOOD/ETH',
      delta: 18.4,
      pair: 'HOOD/ETH',
      strategyId: 'dca_pool',
    })
    pushVault({
      id: uid('vault'),
      at: seeds[1]!.at,
      label: 'SIM scout mark FOX/ETH',
      delta: -6.2,
      pair: 'FOX/ETH',
      strategyId: 'momentum_scout',
    })
  }

  return listActions()
}

/**
 * Run one HOOD community desk tick — appends SIMULATED actions + vault marks.
 * Safe to call from UI when masterEnabled; never hits a chain.
 */
export function tickCommunityDesk(force = false): {
  actions: AgentAction[]
  settings: CommunityDeskSettings
} {
  const settings = loadSettings()
  if (!settings.masterEnabled && !force) {
    return { actions: [], settings }
  }

  const enabled = STRATEGIES.filter((s) => settings.strategies[s.id]?.enabled)
  const pool = enabled.length ? enabled : [STRATEGIES[0]!]
  const def = pick(pool)
  const st = settings.strategies[def.id]
  const pair = pick(def.pairs)

  let kind: AgentActionKind = 'scan'
  if (def.flavorOnly) kind = 'boost'
  else if (def.id === 'risk_off') kind = Math.random() > 0.55 ? 'pause' : 'note'
  else if (def.id === 'momentum_scout') {
    const r = Math.random()
    kind = r > 0.62 ? 'buy' : r > 0.35 ? 'sell' : 'scan'
  } else {
    kind = Math.random() > 0.25 ? 'buy' : 'scan'
  }

  const size =
    kind === 'buy' || kind === 'sell'
      ? sizeFor(settings.risk, st.allocationPct)
      : def.flavorOnly
        ? 'flavor'
        : '—'

  const action: AgentAction = {
    id: uid('sim_act'),
    at: new Date().toISOString(),
    strategyId: def.id,
    strategyName: def.name,
    kind,
    pair,
    size,
    reason: reasonFor(def, kind, pair),
    voice: def.voice,
    simulated: true,
  }

  pushActions([action])

  if (kind === 'buy' || kind === 'sell') {
    const mag = (20 + Math.random() * 80) * RISK_MULT[settings.risk] * (st.allocationPct / 40)
    const signed = kind === 'buy' ? mag * (Math.random() > 0.35 ? 1 : -0.4) : mag * (Math.random() > 0.5 ? 1 : -1)
    pushVault({
      id: uid('vault'),
      at: action.at,
      label: `SIM ${kind.toUpperCase()} ${pair}`,
      delta: Math.round(signed * 100) / 100,
      pair,
      strategyId: def.id,
    })
  } else if (kind === 'boost') {
    pushVault({
      id: uid('vault'),
      at: action.at,
      label: 'SIM DogiHood pride (flavor · $0 size)',
      delta: 0,
      pair,
      strategyId: def.id,
    })
  }

  const next = updateSettings({ lastTickAt: action.at })
  return { actions: [action], settings: next }
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

/** Soft auto-tick when schedule elapsed (also used for live-feeling UI polls). */
export function maybeAutoTick(): AgentAction[] {
  const s = loadSettings()
  if (!s.masterEnabled) return []
  const last = s.lastTickAt ? new Date(s.lastTickAt).getTime() : 0
  // Demo UX: tick every ~45s while page open, independent of nominal schedule label
  const demoInterval = 45_000
  if (Date.now() - last < demoInterval) return []
  return tickCommunityDesk().actions
}

export const HOOD_AGENT_STATUS = {
  online: true,
  desk: 'COMMUNITY DESK',
  mode: 'SIM MODE',
  chain: 'RH 4663',
} as const
