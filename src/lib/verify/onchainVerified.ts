/**
 * On-chain contract verification via Robinhood Chain Blockscout (4663).
 * Cache + demo override. Never fake-verify unknown addresses.
 */

import { EXPLORER_ADDRESS, EXPLORER_BASE } from '../chain'
import { HOOD_DEMO_ADDRESS } from '../trade/demoTokens'
import { HOOD_TOKEN_ADDRESS } from '../hoodToken'

const CACHE_KEY = 'hood-desk:verify:v1'
const OVERRIDE_KEY = 'hood-desk:verify:override:v1'
const CACHE_TTL_MS = 1000 * 60 * 60 * 6 // 6h

export type VerifyStatus = {
  address: string
  verified: boolean
  source: 'blockscout' | 'override' | 'known' | 'cache' | 'unknown'
  checkedAt: string
  name?: string
}

type CacheMap = Record<string, VerifyStatus & { expiresAt: number }>
type OverrideMap = Record<string, boolean>

/** Known demo / env addresses treated as verified for local UX. */
const KNOWN_VERIFIED = new Set<string>(
  [
    HOOD_DEMO_ADDRESS,
    '0xCcFf00000000000000000000000000000000a11e',
    '0xCcFf00000000000000000000000000000000b007',
    HOOD_TOKEN_ADDRESS || '',
  ]
    .filter(Boolean)
    .map((a) => a.toLowerCase()),
)

function norm(addr: string): string {
  return addr.trim().toLowerCase()
}

function readCache(): CacheMap {
  try {
    const raw = localStorage.getItem(CACHE_KEY)
    if (!raw) return {}
    return JSON.parse(raw) as CacheMap
  } catch {
    return {}
  }
}

function writeCache(map: CacheMap): void {
  localStorage.setItem(CACHE_KEY, JSON.stringify(map))
}

function readOverrides(): OverrideMap {
  try {
    const raw = localStorage.getItem(OVERRIDE_KEY)
    if (!raw) return {}
    return JSON.parse(raw) as OverrideMap
  } catch {
    return {}
  }
}

function writeOverrides(map: OverrideMap): void {
  localStorage.setItem(OVERRIDE_KEY, JSON.stringify(map))
}

/** Sync peek — override / known / fresh cache only. Does not hit network. */
export function getCachedVerified(address: string): VerifyStatus | null {
  const a = norm(address)
  if (!a.startsWith('0x') || a.length !== 42) return null

  const overrides = readOverrides()
  if (a in overrides) {
    return {
      address: a,
      verified: overrides[a],
      source: 'override',
      checkedAt: new Date().toISOString(),
    }
  }

  if (KNOWN_VERIFIED.has(a)) {
    return {
      address: a,
      verified: true,
      source: 'known',
      checkedAt: new Date().toISOString(),
      name: 'Known verified (demo/env)',
    }
  }

  const cache = readCache()
  const hit = cache[a]
  if (hit && hit.expiresAt > Date.now()) {
    return { ...hit, source: 'cache' }
  }
  return null
}

/** Manual demo override — Marks verified locally only. */
export function markVerifiedDemo(address: string, verified = true): VerifyStatus {
  const a = norm(address)
  const overrides = readOverrides()
  overrides[a] = verified
  writeOverrides(overrides)
  const status: VerifyStatus = {
    address: a,
    verified,
    source: 'override',
    checkedAt: new Date().toISOString(),
    name: verified ? 'Marked verified (demo)' : 'Unmarked',
  }
  const cache = readCache()
  cache[a] = { ...status, expiresAt: Date.now() + CACHE_TTL_MS }
  writeCache(cache)
  return status
}

export function clearVerifyOverride(address: string): void {
  const a = norm(address)
  const overrides = readOverrides()
  delete overrides[a]
  writeOverrides(overrides)
}

export function explorerVerifyUrl(address: string): string {
  return `${EXPLORER_ADDRESS(address)}?tab=contract`
}

export function explorerBase(): string {
  return EXPLORER_BASE
}

/**
 * Check Blockscout API for contract source verification.
 * Uses v2 smart-contracts endpoint; falls back to legacy getsourcecode.
 */
export async function checkOnchainVerified(address: string): Promise<VerifyStatus> {
  const a = norm(address)
  if (!a.startsWith('0x') || a.length !== 42) {
    return {
      address: a,
      verified: false,
      source: 'unknown',
      checkedAt: new Date().toISOString(),
    }
  }

  const cached = getCachedVerified(a)
  if (cached && (cached.source === 'override' || cached.source === 'known' || cached.source === 'cache')) {
    if (cached.source !== 'cache' || cached.verified) return cached
    // stale false from cache still returned above if not expired — ok
    if (cached.source === 'cache') return cached
  }

  let verified = false
  let name: string | undefined

  try {
    const v2 = `${EXPLORER_BASE}/api/v2/smart-contracts/${a}`
    const res = await fetch(v2, { headers: { Accept: 'application/json' } })
    if (res.ok) {
      const data = (await res.json()) as {
        is_verified?: boolean
        name?: string
        source_code?: string | null
      }
      verified = Boolean(data.is_verified || data.source_code)
      name = data.name
    } else if (res.status === 404) {
      verified = false
    } else {
      // legacy fallback
      const legacy = `${EXPLORER_BASE}/api?module=contract&action=getsourcecode&address=${a}`
      const res2 = await fetch(legacy)
      if (res2.ok) {
        const data = (await res2.json()) as {
          status?: string
          result?: Array<{ SourceCode?: string; ContractName?: string }>
        }
        const row = data.result?.[0]
        verified = Boolean(row?.SourceCode && row.SourceCode.length > 2)
        name = row?.ContractName
      }
    }
  } catch {
    // Network / CORS — keep known/override only; do not invent true
    if (KNOWN_VERIFIED.has(a)) {
      verified = true
      name = 'Known verified (offline)'
    }
  }

  const status: VerifyStatus = {
    address: a,
    verified,
    source: verified && KNOWN_VERIFIED.has(a) && !name ? 'known' : 'blockscout',
    checkedAt: new Date().toISOString(),
    name,
  }

  const cache = readCache()
  cache[a] = { ...status, expiresAt: Date.now() + CACHE_TTL_MS }
  writeCache(cache)
  return status
}

/** Convenience: true only when verified === true (never fake). */
export function isVerifiedSync(address: string): boolean {
  return getCachedVerified(address)?.verified === true
}
