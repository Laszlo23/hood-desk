/**
 * Weekly motivational banner — auto-rotates from seeded lines, overridable in localStorage.
 */

const KEY_OVERRIDE = 'hood-desk:banner:override:v1'

export type BannerOverride = {
  text: string
  /** Week key e.g. 2026-W40 — empty = apply to current week only until cleared */
  weekKey: string
  updatedAt: string
}

const SEEDED: string[] = [
  'Sherwood → Hood Street: take from the rich, feed the community desk. HOOD keeps the mist honest.',
  'Ship fair launches on RH 4663 — creators earn when the street trades.',
  'Follow a bot. Simulate a fill. Watch Rewards tick. Demo today, DEX tomorrow.',
  'Hood Street energy: dark + neon. Build the desk that stays online.',
  'One click: Create → Fair launch → Trade → Rewards. Keep the streak.',
  'No fake routers. Honest ledgers. When RH DEX lands, fees get real.',
  'Skill Market + Trade + Blog — the AI business loop, Bankr-style.',
  'Token creators 50% · Platform 30% · Bot/referrer 20%. Documented. Adjustable.',
  'GM Hood Street — fox on duty. FID 873944 · @0xleonardo.',
  'DogiHood pack pride — pixel Shibas on RH 4663. OpenSea · Dogiflow+ vibes on the desk.',
]

/** ISO week key for Europe/Vienna (approx via local Vienna date). */
export function currentWeekKey(d = new Date()): string {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Europe/Vienna',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(d)
  const y = Number(parts.find((p) => p.type === 'year')?.value)
  const m = Number(parts.find((p) => p.type === 'month')?.value)
  const day = Number(parts.find((p) => p.type === 'day')?.value)
  const vienna = new Date(Date.UTC(y, m - 1, day))
  const tmp = new Date(vienna.getTime())
  tmp.setUTCDate(tmp.getUTCDate() + 4 - (tmp.getUTCDay() || 7))
  const yearStart = new Date(Date.UTC(tmp.getUTCFullYear(), 0, 1))
  const week = Math.ceil(((tmp.getTime() - yearStart.getTime()) / 86400000 + 1) / 7)
  return `${tmp.getUTCFullYear()}-W${String(week).padStart(2, '0')}`
}

export function weekOfLabel(weekKey?: string): string {
  const key = weekKey || currentWeekKey()
  const [year, w] = key.split('-W')
  return `Week of ${year} · W${w}`
}

export function getBannerOverride(): BannerOverride | null {
  try {
    const raw = localStorage.getItem(KEY_OVERRIDE)
    if (!raw) return null
    return JSON.parse(raw) as BannerOverride
  } catch {
    return null
  }
}

export function setBannerOverride(text: string, weekKey?: string): BannerOverride {
  const o: BannerOverride = {
    text: text.trim(),
    weekKey: weekKey?.trim() || currentWeekKey(),
    updatedAt: new Date().toISOString(),
  }
  localStorage.setItem(KEY_OVERRIDE, JSON.stringify(o))
  return o
}

export function clearBannerOverride(): void {
  localStorage.removeItem(KEY_OVERRIDE)
}

export function seededBannerForWeek(weekKey?: string): string {
  const key = weekKey || currentWeekKey()
  const n = Number(key.replace(/\D/g, '')) || 0
  return SEEDED[n % SEEDED.length]
}

export function getWeeklyBanner(): {
  text: string
  weekKey: string
  weekLabel: string
  overridden: boolean
} {
  const weekKey = currentWeekKey()
  const override = getBannerOverride()
  if (override?.text && (!override.weekKey || override.weekKey === weekKey)) {
    return {
      text: override.text,
      weekKey,
      weekLabel: weekOfLabel(weekKey),
      overridden: true,
    }
  }
  return {
    text: seededBannerForWeek(weekKey),
    weekKey,
    weekLabel: weekOfLabel(weekKey),
    overridden: false,
  }
}

export { SEEDED as BANNER_SEED_LINES, KEY_OVERRIDE as BANNER_OVERRIDE_KEY }
