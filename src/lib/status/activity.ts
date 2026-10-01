/**
 * Local desk activity for Status density — simulated trades / XP only.
 * Never claims live DEX fills.
 */

import { listOrders } from '../trade/orders'
import { getGamification } from '../gamification'
import { listSkillPacks } from '../market/skillMarket'
import { DOGIHOOD } from '../nfts/dogihood'
import { FEATURED_RH_TX, shortHash } from './featured'

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
  const now = Date.now()

  for (const o of listOrders().slice(0, 40)) {
    items.push({
      id: `ord-${o.id}`,
      kind: 'order',
      at: o.createdAt,
      title: `${o.side.toUpperCase()} ${o.tokenSymbol}`,
      detail: `${o.type} · ${o.amount} ${o.quote} · ${o.status}`,
      badge: 'ONCHAIN',
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

  const packs = listSkillPacks()
    .filter((p) => p.featured || p.isDemo)
    .slice(0, 3)
  packs.forEach((p, i) => {
    items.push({
      id: `pack-${p.id}`,
      kind: 'pack',
      at: p.createdAt || new Date(now - (i + 2) * 3_600_000).toISOString(),
      title: p.featured ? `Featured pack · ${p.name}` : `Demo bot · ${p.name}`,
      detail: `@${p.authorHandle} · ${p.followerCount} followers · ${p.rating.toFixed(1)}★`,
      badge: p.featured ? 'FEATURED' : 'DEMO',
    })
  })

  items.push({
    id: 'dogihood-featured',
    kind: 'featured',
    at: new Date(now - 5_400_000).toISOString(),
    title: `${DOGIHOOD.name} pack pride`,
    detail: `Sample #${DOGIHOOD.sampleTokenId} · ${DOGIHOOD.badges.join(' · ')} · RH ${DOGIHOOD.chainId}`,
    badge: 'NFT',
  })

  items.push({
    id: 'featured-hash-watch',
    kind: 'featured',
    at: new Date(now - 7_200_000).toISOString(),
    title: 'Watched hash · not on RH',
    detail: `${shortHash(FEATURED_RH_TX, 6, 4)} — explorer miss · desk status only`,
    badge: 'WATCH',
  })

  items.push({
    id: 'desk-online',
    kind: 'desk',
    at: new Date().toISOString(),
    title: 'Desk online',
    detail: 'HOOD agent · RH 4663 · DogiHood pack featured',
    badge: 'LIVE',
  })

  return items
    .sort((a, b) => (a.at < b.at ? 1 : -1))
    .slice(0, limit)
}
