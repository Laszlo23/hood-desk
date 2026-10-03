/**
 * Light gamification — XP, level, daily streak, badges.
 * localStorage only; tasteful chip in nav — not casino spam.
 */

import { xpBoostMultiplier } from './subscription'

const KEY = 'hood-desk:gamification:v1'

export type XpAction =
  | 'connect'
  | 'follow_bot'
  | 'simulate_trade'
  | 'publish_bot'
  | 'create_project'
  | 'publish_drop'
  | 'write_blog'
  | 'night_clear'
  | 'sign_book'

export type BadgeId = 'first_trade' | 'creator' | 'follower' | 'streak_3' | 'of_the_wood' | 'in_the_book'

export type GamificationState = {
  xp: number
  level: number
  streak: number
  /** YYYY-MM-DD in Europe/Vienna */
  lastActiveDate: string | null
  badges: BadgeId[]
  actionsDone: Partial<Record<XpAction, number>>
}

const XP_REWARDS: Record<XpAction, number> = {
  connect: 15,
  follow_bot: 25,
  simulate_trade: 20,
  publish_bot: 40,
  create_project: 30,
  publish_drop: 120,
  write_blog: 35,
  night_clear: 25,
  sign_book: 40,
}

const BADGE_META: Record<BadgeId, { label: string; emoji: string }> = {
  first_trade: { label: 'First Trade', emoji: '⚡' },
  creator: { label: 'Creator', emoji: '🏗️' },
  follower: { label: 'Follower', emoji: '🤝' },
  streak_3: { label: 'Streak 3', emoji: '🔥' },
  of_the_wood: { label: 'Of the wood', emoji: '🌲' },
  in_the_book: { label: 'In the book', emoji: '✎' },
}

function viennaDate(): string {
  try {
    return new Intl.DateTimeFormat('en-CA', {
      timeZone: 'Europe/Vienna',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    }).format(new Date())
  } catch {
    return new Date().toISOString().slice(0, 10)
  }
}

function levelFromXp(xp: number): number {
  let level = 1
  let need = 50
  let rem = xp
  while (rem >= need) {
    rem -= need
    level += 1
    need = Math.floor(need * 1.35 + 20)
  }
  return level
}

function xpToNext(xp: number): { level: number; into: number; need: number } {
  let level = 1
  let need = 50
  let rem = xp
  while (rem >= need) {
    rem -= need
    level += 1
    need = Math.floor(need * 1.35 + 20)
  }
  return { level, into: rem, need }
}

function defaultState(): GamificationState {
  return {
    xp: 0,
    level: 1,
    streak: 0,
    lastActiveDate: null,
    badges: [],
    actionsDone: {},
  }
}

function read(): GamificationState {
  try {
    const raw = localStorage.getItem(KEY)
    if (!raw) return defaultState()
    return { ...defaultState(), ...(JSON.parse(raw) as GamificationState) }
  } catch {
    return defaultState()
  }
}

function write(state: GamificationState): void {
  localStorage.setItem(KEY, JSON.stringify(state))
}

function bumpStreak(state: GamificationState): void {
  const today = viennaDate()
  if (state.lastActiveDate === today) return
  if (!state.lastActiveDate) {
    state.streak = 1
  } else {
    const prev = new Date(state.lastActiveDate + 'T12:00:00')
    const cur = new Date(today + 'T12:00:00')
    const diffDays = Math.round((cur.getTime() - prev.getTime()) / 86_400_000)
    state.streak = diffDays === 1 ? state.streak + 1 : 1
  }
  state.lastActiveDate = today
  if (state.streak >= 3 && !state.badges.includes('streak_3')) {
    state.badges.push('streak_3')
  }
}

export function getGamification(): GamificationState {
  const s = read()
  s.level = levelFromXp(s.xp)
  return s
}

export function awardXp(
  action: XpAction,
  opts?: { once?: boolean },
): { awarded: number; state: GamificationState; newBadges: BadgeId[] } {
  const state = read()
  const once = opts?.once ?? action === 'connect'
  if (once && (state.actionsDone[action] ?? 0) > 0) {
    bumpStreak(state)
    write(state)
    return { awarded: 0, state, newBadges: [] }
  }

  const beforeBadges = new Set(state.badges)
  const base = XP_REWARDS[action]
  const pts = Math.round(base * xpBoostMultiplier())
  state.xp += pts
  state.actionsDone[action] = (state.actionsDone[action] ?? 0) + 1
  bumpStreak(state)
  state.level = levelFromXp(state.xp)

  if (action === 'simulate_trade' && !state.badges.includes('first_trade')) {
    state.badges.push('first_trade')
  }
  if (
    (action === 'create_project' || action === 'publish_bot' || action === 'publish_drop') &&
    !state.badges.includes('creator')
  ) {
    state.badges.push('creator')
  }
  if (action === 'follow_bot' && !state.badges.includes('follower')) {
    state.badges.push('follower')
  }
  if (action === 'night_clear' && !state.badges.includes('of_the_wood')) {
    state.badges.push('of_the_wood')
  }
  if (action === 'sign_book' && !state.badges.includes('in_the_book')) {
    state.badges.push('in_the_book')
  }
  if (state.streak >= 3 && !state.badges.includes('streak_3')) {
    state.badges.push('streak_3')
  }

  write(state)
  const newBadges = state.badges.filter((b) => !beforeBadges.has(b))
  return { awarded: pts, state, newBadges }
}

export function badgeMeta(id: BadgeId): { label: string; emoji: string } {
  return BADGE_META[id]
}

export function xpProgress(state?: GamificationState): {
  level: number
  xp: number
  into: number
  need: number
  pct: number
} {
  const s = state ?? getGamification()
  const { level, into, need } = xpToNext(s.xp)
  return {
    level,
    xp: s.xp,
    into,
    need,
    pct: need > 0 ? Math.min(100, Math.round((into / need) * 100)) : 100,
  }
}

export { XP_REWARDS, BADGE_META }
