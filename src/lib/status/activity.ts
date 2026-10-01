/**
 * Status activity is only what this browser saved: signed swaps and desk XP.
 * Skill lists and sample NFTs are not events.
 */

import { listOrders } from '../trade/orders'
import { getGamification } from '../gamification'

export type DeskActivityKind = 'order' | 'xp' | 'desk' | 'featured' | 'pack' | 'skill'

export type DeskActivityItem = {
  id: string
  kind: DeskActivityKind
  at: string
  title: string
  detail: string
  badge?: string
}

export function lastLocalActivitySummary(): string | null {
  const orders = listOrders()
  if (orders[0]) {
    const o = orders[0]
    return `${o.side} ${o.tokenSymbol} · ${o.txHash?.slice(0, 10) ?? o.id.slice(0, 10)}…`
  }
  const g = getGamification()
  if (g.xp > 0) return `XP ${g.xp} · L${g.level}`
  return null
}

export function buildLocalActivityFeed(limit = 24): DeskActivityItem[] {
  const items: DeskActivityItem[] = []

  for (const o of listOrders().slice(0, 40)) {
    items.push({
      id: `ord-${o.id}`,
      kind: 'order',
      at: o.createdAt,
      title: `${o.side.toUpperCase()} ${o.tokenSymbol}`,
      detail: `${o.type} · ${o.amount} ${o.quote} · ${o.status}`,
      badge: o.txHash ? 'SIGNED' : 'SAVED',
    })
  }

  const g = getGamification()
  if (g.xp > 0) {
    items.push({
      id: 'xp-snapshot',
      kind: 'xp',
      at: g.lastActiveDate
        ? `${g.lastActiveDate}T12:00:00.000Z`
        : new Date().toISOString(),
      title: `Desk XP · L${g.level}`,
      detail: `${g.xp} XP · streak ${g.streak} · badges ${g.badges.length}`,
      badge: 'LOCAL',
    })
  }

  return items
    .sort((a, b) => (a.at < b.at ? 1 : -1))
    .slice(0, limit)
}
