import { getGamification, type BadgeId } from './gamification'
import { listOrders } from './trade/orders'
import { readNightSave } from '../game/nightMarks'
import { bestOf } from './nightBoard'

export type DeskMark = 'swap' | 'mornings' | 'maker' | 'seeder' | 'circle' | 'wood'

export type DeskCardData = {
  address: string | null
  level: number
  streak: number
  swaps: number
  night: number
  best: number
  marks: DeskMark[]
}

const MARKS: DeskMark[] = ['swap', 'mornings', 'maker', 'seeder', 'circle', 'wood']

export const DESK_MARK_LABEL: Record<DeskMark, string> = {
  swap: 'Signed a swap',
  mornings: 'Three mornings',
  maker: 'Left a mark',
  seeder: 'Seeder pass',
  circle: 'Inner Circle',
  wood: 'Of the wood',
}

function clamp(n: number, max: number): number {
  if (!Number.isFinite(n) || n < 0) return 0
  return Math.min(max, Math.floor(n))
}

function cleanAddress(raw: unknown): string | null {
  const value = String(raw || '').trim()
  if (!/^0x[a-fA-F0-9]{40}$/.test(value)) return null
  return value
}

export function shortDeskAddress(addr: string | null): string {
  if (!addr || addr.length < 10) return 'A walker in the wood'
  return `${addr.slice(0, 6)}…${addr.slice(-4)}`
}

export function marksFromDesk(badges: BadgeId[], swaps: number, streak: number, night = 0): DeskMark[] {
  const marks: DeskMark[] = []
  if (swaps > 0 || badges.includes('first_trade')) marks.push('swap')
  if (streak >= 3 || badges.includes('streak_3')) marks.push('mornings')
  if (badges.includes('creator')) marks.push('maker')
  if (night > 0 || badges.includes('of_the_wood')) marks.push('wood')
  return marks
}

export function buildLocalCard(address: string | null, chainMarks: DeskMark[] = []): DeskCardData {
  const state = getGamification()
  const swaps = listOrders().length
  const nightSave = readNightSave()
  const night = clamp(nightSave.total, 9_999_999)
  const best = clamp(bestOf(nightSave.best), 9_999_999)
  const marks = marksFromDesk(state.badges, swaps, state.streak, night)
  for (const mark of chainMarks) {
    if ((mark === 'seeder' || mark === 'circle') && !marks.includes(mark)) marks.push(mark)
  }
  return {
    address: cleanAddress(address),
    level: clamp(state.level, 99),
    streak: clamp(state.streak, 999),
    swaps: clamp(swaps, 9999),
    night,
    best,
    marks,
  }
}

export function encodeCard(card: DeskCardData): string {
  const json = JSON.stringify({
    a: card.address,
    l: card.level,
    s: card.streak,
    w: card.swaps,
    n: card.night,
    b: card.best,
    m: card.marks,
  })
  return btoa(json).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '')
}

export function decodeCard(raw: string): DeskCardData | null {
  try {
    const padded = raw.replace(/-/g, '+').replace(/_/g, '/')
    const json = atob(padded)
    const parsed = JSON.parse(json) as {
      a?: unknown
      l?: unknown
      s?: unknown
      w?: unknown
      n?: unknown
      b?: unknown
      m?: unknown
    }
    const marks = Array.isArray(parsed.m)
      ? parsed.m.filter((mark): mark is DeskMark => MARKS.includes(mark as DeskMark))
      : []
    return {
      address: cleanAddress(parsed.a),
      level: clamp(Number(parsed.l), 99) || 1,
      streak: clamp(Number(parsed.s), 999),
      swaps: clamp(Number(parsed.w), 9999),
      night: clamp(Number(parsed.n), 9_999_999),
      best: clamp(Number(parsed.b), 9_999_999),
      marks,
    }
  } catch {
    return null
  }
}

export function cardShareUrl(card: DeskCardData): string {
  const payload = encodeURIComponent(encodeCard(card))
  return `${window.location.origin}${window.location.pathname}#/card?c=${payload}`
}

export function cardFromHash(hash: string): DeskCardData | null {
  const query = hash.includes('?') ? hash.slice(hash.indexOf('?') + 1) : ''
  const raw = new URLSearchParams(query).get('c')
  if (!raw) return null
  return decodeCard(raw)
}
