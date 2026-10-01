/**
 * Skill Market — local catalog of agent skill packs / trading bots.
 * Follow activates a bot's skill config into the user's agent (localStorage).
 * Creator perks + compensation are a DEMO LEDGER only (no on-chain transfers).
 */

import type { SkillId } from '../agent/skills'
import { listProjects } from '../projects'
import {
  canUseFeaturedBadge,
  countOwnedPublishedBots,
  maxFollowSlots,
  maxPublishedBots,
} from '../subscription'

const NS = 'hood-desk:skill-market'
const KEY_BOTS = `${NS}:bots:v1`
const KEY_FOLLOWS = `${NS}:follows:v1`
const KEY_ACTIVE = `${NS}:active-bot:v1`
const KEY_CREATORS = `${NS}:creators:v1`
const KEY_LEDGER = `${NS}:ledger:v1`
const KEY_AGENT_SKILLS = 'hood-desk:agent:active-skills:v1'

/** Demo fee split shown in UI — not live until RH DEX + real fee split. */
export const DEMO_FEE_SPLIT = { creatorPct: 70, treasuryPct: 30 } as const

export const FOLLOW_BONUS_CREDITS = 12
export const USAGE_CREDIT_VET = 2
export const USAGE_CREDIT_ORDER = 4

export type SkillPack = {
  id: string
  name: string
  authorHandle: string
  authorWallet?: string
  description: string
  skillTags: string[]
  /** Skill ids activated when this bot is followed / set primary */
  skillConfig: SkillId[]
  followerCount: number
  rating: number
  featured?: boolean
  createdAt: string
  isDemo?: boolean
  creatorId: string
}

export type CreatorProfile = {
  id: string
  handle: string
  wallet?: string
  packsPublished: string[]
  followerCount: number
  followCredits: number
  usageCredits: number
  /** Simulated $HOOD credit (demo ledger) */
  earningsSim: number
  perks: string[]
  feeSharePct: number
}

export type LedgerEntry = {
  id: string
  at: string
  type: 'follow_bonus' | 'usage_share' | 'publish' | 'unfollow'
  botId: string
  creatorId: string
  amount: number
  note: string
}

export type FollowState = {
  followedIds: string[]
}

function uid(prefix: string): string {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 7)}`
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

const DEMO_CREATORS: CreatorProfile[] = [
  {
    id: 'creator_leonardo',
    handle: '@0xleonardo',
    wallet: undefined,
    packsPublished: ['bot_hood_vet_pro'],
    followerCount: 128,
    followCredits: 640,
    usageCredits: 420,
    earningsSim: 186.4,
    perks: ['Creator', 'Featured slot', 'FID 873944'],
    feeSharePct: DEMO_FEE_SPLIT.creatorPct,
  },
  {
    id: 'creator_dca',
    handle: '@dca_desk',
    packsPublished: ['bot_dca_desk'],
    followerCount: 64,
    followCredits: 280,
    usageCredits: 190,
    earningsSim: 72.1,
    perks: ['Creator'],
    feeSharePct: DEMO_FEE_SPLIT.creatorPct,
  },
  {
    id: 'creator_scout',
    handle: '@fairscout',
    packsPublished: ['bot_fair_scout'],
    followerCount: 41,
    followCredits: 160,
    usageCredits: 88,
    earningsSim: 38.5,
    perks: ['Creator'],
    feeSharePct: DEMO_FEE_SPLIT.creatorPct,
  },
  {
    id: 'creator_chart',
    handle: '@charthawk',
    packsPublished: ['bot_chart_hawk'],
    followerCount: 55,
    followCredits: 210,
    usageCredits: 140,
    earningsSim: 51.2,
    perks: ['Creator'],
    feeSharePct: DEMO_FEE_SPLIT.creatorPct,
  },
  {
    id: 'creator_neon',
    handle: '@neonops',
    packsPublished: ['bot_neon_ops'],
    followerCount: 33,
    followCredits: 120,
    usageCredits: 60,
    earningsSim: 24.0,
    perks: ['Creator'],
    feeSharePct: DEMO_FEE_SPLIT.creatorPct,
  },
  {
    id: 'creator_hood_agent',
    handle: '@hood',
    packsPublished: ['bot_hood_community'],
    followerCount: 420,
    followCredits: 2400,
    usageCredits: 1800,
    earningsSim: 466.3,
    perks: ['Flagship agent', 'Community desk', 'Featured slot'],
    feeSharePct: DEMO_FEE_SPLIT.creatorPct,
  },
]

const DEMO_BOTS: SkillPack[] = [
  {
    id: 'bot_hood_community',
    name: 'HOOD Community Desk',
    authorHandle: '@hood',
    description:
      'The desk agent. It can read the pool, list skills, and answer a fair-launch question. It does not place a swap.',
    skillTags: ['community', 'auto-trade', 'DCA', 'HOOD agent', 'trade.order'],
    skillConfig: ['trade_order', 'trade_chart', 'portfolio', 'daily_brief', 'fox_coach', 'help'],
    followerCount: 420,
    rating: 5.0,
    featured: true,
    createdAt: '2026-09-20T12:00:00.000Z',
    isDemo: true,
    creatorId: 'creator_hood_agent',
  },
  {
    id: 'bot_hood_vet_pro',
    name: 'Hood Vet Pro',
    authorHandle: '@0xleonardo',
    description:
      'Checks a token before you trade it. @0xleonardo · FID 873944.',
    skillTags: ['trade.vet', 'trade.order', 'portfolio', 'ensure_chain'],
    skillConfig: ['trade_vet', 'trade_order', 'portfolio', 'ensure_chain', 'help'],
    followerCount: 128,
    rating: 4.8,
    featured: true,
    createdAt: '2026-09-01T12:00:00.000Z',
    isDemo: true,
    creatorId: 'creator_leonardo',
  },
  {
    id: 'bot_dca_desk',
    name: 'DCA Desk',
    authorHandle: '@dca_desk',
    description: 'Sizing notes for a calm buy. The swap still signs in your wallet.',
    skillTags: ['DCA', 'trade.order', 'trade.chart', 'portfolio'],
    skillConfig: ['trade_order', 'trade_chart', 'portfolio', 'daily_brief', 'help'],
    followerCount: 64,
    rating: 4.5,
    featured: false,
    createdAt: '2026-09-05T12:00:00.000Z',
    isDemo: true,
    creatorId: 'creator_dca',
  },
  {
    id: 'bot_fair_scout',
    name: 'Fair Launch Scout',
    authorHandle: '@fairscout',
    description: 'Scouts fair-launch status, project pitch, and social drafts before you ship.',
    skillTags: ['fair_launch', 'projects', 'draft_tweet', 'pitch'],
    skillConfig: [
      'fair_launch_status',
      'explain_fair_launch',
      'list_projects',
      'summarize_project_pitch',
      'draft_tweet',
      'help',
    ],
    followerCount: 41,
    rating: 4.3,
    featured: false,
    createdAt: '2026-09-08T12:00:00.000Z',
    isDemo: true,
    creatorId: 'creator_scout',
  },
  {
    id: 'bot_chart_hawk',
    name: 'Chart Hawk',
    authorHandle: '@charthawk',
    description: 'Reads the $HOOD chart, which is built from pool swaps.',
    skillTags: ['trade.chart', 'price', 'neon_tips'],
    skillConfig: ['trade_chart', 'price', 'neon_tips', 'portfolio', 'help'],
    followerCount: 55,
    rating: 4.4,
    featured: false,
    createdAt: '2026-09-10T12:00:00.000Z',
    isDemo: true,
    creatorId: 'creator_chart',
  },
  {
    id: 'bot_neon_ops',
    name: 'Neon Ops',
    authorHandle: '@neonops',
    description: 'Explains how the desk stays up, and what is actually paid.',
    skillTags: ['ops', 'treasury', 'revenue', 'fox_coach'],
    skillConfig: [
      'how_desk_runs',
      'treasury_explain',
      'revenue_demo_stats',
      'fox_coach',
      'daily_brief',
      'help',
    ],
    followerCount: 33,
    rating: 4.2,
    featured: false,
    createdAt: '2026-09-12T12:00:00.000Z',
    isDemo: true,
    creatorId: 'creator_neon',
  },
]

function ensureSeeded(): void {
  const bots = readJson<SkillPack[] | null>(KEY_BOTS, null)
  if (!bots || bots.length === 0) {
    writeJson(KEY_BOTS, DEMO_BOTS)
  } else {
    // Merge any missing demo bots by id
    let changed = false
    for (const d of DEMO_BOTS) {
      const existing = bots.find((b) => b.id === d.id)
      if (!existing) {
        bots.push(d)
        changed = true
      } else if (existing.isDemo && existing.description !== d.description) {
        existing.description = d.description
        changed = true
      }
    }
    if (changed) writeJson(KEY_BOTS, bots)
  }

  const creators = readJson<CreatorProfile[] | null>(KEY_CREATORS, null)
  if (!creators || creators.length === 0) {
    writeJson(KEY_CREATORS, DEMO_CREATORS)
  }
}

export function listSkillPacks(): SkillPack[] {
  ensureSeeded()
  const bots = readJson<SkillPack[]>(KEY_BOTS, DEMO_BOTS)
  // Project-derived packs (optional, from local projects with persona)
  const projectPacks: SkillPack[] = []
  try {
    const projects = listProjects()
    for (const p of projects.slice(0, 8)) {
      const id = `bot_proj_${p.id}`
      if (bots.some((b) => b.id === id)) continue
      projectPacks.push({
        id,
        name: `${p.name} Agent`,
        authorHandle: p.ticker ? `$${p.ticker}` : '@you',
        description:
          p.agentPersona ||
          p.description ||
          `Project agent for ${p.name}. Publish from Skill Market to earn creator perks.`,
        skillTags: ['project', 'trade.vet', 'pitch'],
        skillConfig: [
          'list_projects',
          'show_project',
          'summarize_project_pitch',
          'trade_vet',
          'help',
        ],
        followerCount: 0,
        rating: 4.0,
        featured: false,
        createdAt: p.createdAt,
        isDemo: false,
        creatorId: `creator_local_${p.id}`,
      })
    }
  } catch {
    /* ignore */
  }
  return [...bots, ...projectPacks].filter((bot) => !bot.isDemo).sort((a, b) => {
    if (a.featured && !b.featured) return -1
    if (!a.featured && b.featured) return 1
    return b.followerCount - a.followerCount
  })
}

export function getSkillPack(id: string): SkillPack | undefined {
  return listSkillPacks().find((b) => b.id === id)
}

export function getFollows(): FollowState {
  return readJson<FollowState>(KEY_FOLLOWS, { followedIds: [] })
}

export function getActiveBotId(): string | null {
  return readJson<string | null>(KEY_ACTIVE, null)
}

export function getActiveBot(): SkillPack | null {
  const id = getActiveBotId()
  if (!id) return null
  return getSkillPack(id) ?? null
}

export function getActiveSkillConfig(): SkillId[] {
  const bot = getActiveBot()
  if (bot) return bot.skillConfig
  return readJson<SkillId[]>(KEY_AGENT_SKILLS, [])
}

function setActiveSkills(skills: SkillId[]): void {
  writeJson(KEY_AGENT_SKILLS, skills)
}

export function isFollowing(botId: string): boolean {
  return getFollows().followedIds.includes(botId)
}

function bumpCreatorFollowers(creatorId: string, delta: number): void {
  const creators = listCreators()
  const c = creators.find((x) => x.id === creatorId)
  if (!c) return
  c.followerCount = Math.max(0, c.followerCount + delta)
  if (delta > 0 && !c.perks.includes('Creator')) c.perks.push('Creator')
  writeJson(KEY_CREATORS, creators)
}

function bumpBotFollowers(botId: string, delta: number): void {
  ensureSeeded()
  const bots = readJson<SkillPack[]>(KEY_BOTS, [])
  const b = bots.find((x) => x.id === botId)
  if (b) {
    b.followerCount = Math.max(0, b.followerCount + delta)
    writeJson(KEY_BOTS, bots)
  }
}

function appendLedger(entry: Omit<LedgerEntry, 'id' | 'at'>): void {
  const ledger = listLedger()
  ledger.unshift({
    ...entry,
    id: uid('led'),
    at: new Date().toISOString(),
  })
  writeJson(KEY_LEDGER, ledger.slice(0, 200))
}

export function listLedger(): LedgerEntry[] {
  return readJson<LedgerEntry[]>(KEY_LEDGER, [])
}

export function listCreators(): CreatorProfile[] {
  ensureSeeded()
  const seeded = new Set(DEMO_CREATORS.map((creator) => creator.id))
  return readJson<CreatorProfile[]>(KEY_CREATORS, []).filter((creator) => !seeded.has(creator.id))
}

export function getCreator(id: string): CreatorProfile | undefined {
  return listCreators().find((c) => c.id === id)
}

export function getCreatorByHandle(handle: string): CreatorProfile | undefined {
  const h = handle.toLowerCase()
  return listCreators().find((c) => c.handle.toLowerCase() === h)
}

/** Follow a bot — copies skill config into agent + awards creator follow bonus (demo). */
export function followBot(botId: string): { ok: boolean; text: string } {
  const bot = getSkillPack(botId)
  if (!bot) return { ok: false, text: `Unknown bot: ${botId}` }

  const follows = getFollows()
  if (!follows.followedIds.includes(botId)) {
    const maxF = maxFollowSlots()
    if (Number.isFinite(maxF) && follows.followedIds.length >= maxF) {
      return {
        ok: false,
        text: `Follow limit reached (${maxF} on your plan). Upgrade to **Desk** / **Desk+** for more bot slots — open #/subscribe.`,
      }
    }
    follows.followedIds.push(botId)
    writeJson(KEY_FOLLOWS, follows)
    bumpBotFollowers(botId, 1)
    bumpCreatorFollowers(bot.creatorId, 1)

    const creators = listCreators()
    let creator = creators.find((c) => c.id === bot.creatorId)
    if (!creator) {
      creator = {
        id: bot.creatorId,
        handle: bot.authorHandle,
        packsPublished: [bot.id],
        followerCount: 1,
        followCredits: 0,
        usageCredits: 0,
        earningsSim: 0,
        perks: ['Creator'],
        feeSharePct: DEMO_FEE_SPLIT.creatorPct,
      }
      creators.push(creator)
    }
    creator.followCredits += FOLLOW_BONUS_CREDITS
    creator.earningsSim = Math.round((creator.earningsSim + FOLLOW_BONUS_CREDITS * 0.15) * 10) / 10
    if (creator.followerCount >= 50 && !creator.perks.includes('Featured slot')) {
      creator.perks.push('Featured slot')
    }
    writeJson(KEY_CREATORS, creators)

    appendLedger({
      type: 'follow_bonus',
      botId,
      creatorId: bot.creatorId,
      amount: FOLLOW_BONUS_CREDITS,
      note: `Follow bonus → ${bot.authorHandle} (+${FOLLOW_BONUS_CREDITS} perk pts, demo ledger)`,
    })
  }

  // Set as primary active bot
  writeJson(KEY_ACTIVE, botId)
  setActiveSkills(bot.skillConfig)

  return {
    ok: true,
    text: `Following **${bot.name}** (${bot.authorHandle}). Skills activated: ${bot.skillConfig.map((s) => `\`${s}\``).join(', ')}. Set as primary bot.`,
  }
}

export function unfollowBot(botId: string): { ok: boolean; text: string } {
  const bot = getSkillPack(botId)
  const follows = getFollows()
  const idx = follows.followedIds.indexOf(botId)
  if (idx === -1) return { ok: false, text: 'Not following that bot.' }

  follows.followedIds.splice(idx, 1)
  writeJson(KEY_FOLLOWS, follows)
  if (bot) {
    bumpBotFollowers(botId, -1)
    bumpCreatorFollowers(bot.creatorId, -1)
    appendLedger({
      type: 'unfollow',
      botId,
      creatorId: bot.creatorId,
      amount: 0,
      note: `Unfollowed ${bot.name}`,
    })
  }

  const active = getActiveBotId()
  if (active === botId) {
    const next = follows.followedIds[0] ?? null
    writeJson(KEY_ACTIVE, next)
    if (next) {
      const n = getSkillPack(next)
      if (n) setActiveSkills(n.skillConfig)
    } else {
      setActiveSkills([])
    }
  }

  return { ok: true, text: `Unfollowed ${bot?.name ?? botId}.` }
}

export function setActiveBot(botId: string): { ok: boolean; text: string } {
  const bot = getSkillPack(botId)
  if (!bot) return { ok: false, text: `Unknown bot: ${botId}` }
  const follows = getFollows()
  if (!follows.followedIds.includes(botId)) {
    return followBot(botId)
  }
  writeJson(KEY_ACTIVE, botId)
  setActiveSkills(bot.skillConfig)
  return {
    ok: true,
    text: `Primary bot → **${bot.name}**. Skills: ${bot.skillConfig.map((s) => `\`${s}\``).join(', ')}.`,
  }
}

export type PublishInput = {
  name: string
  description: string
  skillTags: string[]
  skillConfig: SkillId[]
  authorHandle: string
  authorWallet?: string
}

/** Publish a new skill pack — creator gets Creator perk + demo ledger entry. */
export function publishBot(input: PublishInput): { ok: boolean; text: string; bot?: SkillPack } {
  const name = input.name.trim()
  if (!name) return { ok: false, text: 'Name required.' }
  if (!input.skillConfig.length) return { ok: false, text: 'Pick at least one skill.' }

  ensureSeeded()
  const existingBots = readJson<SkillPack[]>(KEY_BOTS, [])
  const owned = countOwnedPublishedBots(existingBots, input.authorWallet)
  const maxB = maxPublishedBots()
  if (Number.isFinite(maxB) && owned >= maxB) {
    return {
      ok: false,
      text: `Publish limit reached (${maxB} bot${maxB === 1 ? '' : 's'} on your plan). Activate **Desk** for more deployer/trading agent slots — open #/subscribe.`,
    }
  }
  const handle = input.authorHandle.trim() || '@you'
  let creators = listCreators()
  let creator = creators.find((c) => c.handle.toLowerCase() === handle.toLowerCase())
  if (!creator) {
    creator = {
      id: uid('creator'),
      handle,
      wallet: input.authorWallet,
      packsPublished: [],
      followerCount: 0,
      followCredits: 0,
      usageCredits: 0,
      earningsSim: 0,
      perks: ['Creator'],
      feeSharePct: DEMO_FEE_SPLIT.creatorPct,
    }
    creators.push(creator)
  } else if (!creator.perks.includes('Creator')) {
    creator.perks.push('Creator')
  }

  const bot: SkillPack = {
    id: uid('bot'),
    name,
    authorHandle: creator.handle,
    authorWallet: input.authorWallet || creator.wallet,
    description: input.description.trim() || `${name} skill pack`,
    skillTags: input.skillTags.length ? input.skillTags : ['custom'],
    skillConfig: input.skillConfig,
    followerCount: 0,
    rating: 4.0,
    featured: canUseFeaturedBadge(),
    createdAt: new Date().toISOString(),
    isDemo: false,
    creatorId: creator.id,
  }

  const bots = readJson<SkillPack[]>(KEY_BOTS, [])
  bots.unshift(bot)
  writeJson(KEY_BOTS, bots)

  creator.packsPublished = [...new Set([...creator.packsPublished, bot.id])]
  writeJson(KEY_CREATORS, creators)

  appendLedger({
    type: 'publish',
    botId: bot.id,
    creatorId: creator.id,
    amount: 0,
    note: `Published **${bot.name}** — Creator perk unlocked (demo ledger)`,
  })

  return {
    ok: true,
    bot,
    text: `Published **${bot.name}**. You now have the **Creator** perk. Fee-share stub: ${DEMO_FEE_SPLIT.creatorPct}% creator / ${DEMO_FEE_SPLIT.treasuryPct}% desk treasury (demo until RH DEX).`,
  }
}

/** Accrue usage credits when a follower runs a skill from the active bot. */
export function recordSkillUsage(
  skillKind: 'vet' | 'order' | 'chart' | 'other',
): void {
  const bot = getActiveBot()
  if (!bot) return
  const amount =
    skillKind === 'vet'
      ? USAGE_CREDIT_VET
      : skillKind === 'order'
        ? USAGE_CREDIT_ORDER
        : skillKind === 'chart'
          ? 1
          : 1

  const creators = listCreators()
  let creator = creators.find((c) => c.id === bot.creatorId)
  if (!creator) {
    creator = {
      id: bot.creatorId,
      handle: bot.authorHandle,
      packsPublished: [bot.id],
      followerCount: bot.followerCount,
      followCredits: 0,
      usageCredits: 0,
      earningsSim: 0,
      perks: ['Creator'],
      feeSharePct: DEMO_FEE_SPLIT.creatorPct,
    }
    creators.push(creator)
  }
  creator.usageCredits += amount
  const share = Math.round(amount * 0.1 * 100) / 100
  creator.earningsSim = Math.round((creator.earningsSim + share) * 10) / 10
  writeJson(KEY_CREATORS, creators)

  appendLedger({
    type: 'usage_share',
    botId: bot.id,
    creatorId: creator.id,
    amount,
    note: `Usage share (${skillKind}) via **${bot.name}** → +${amount} credits (demo)`,
  })
}

export function creatorDashboard(handleOrId?: string): CreatorProfile | null {
  const creators = listCreators()
  if (!handleOrId) {
    // Prefer local published creators (non-demo packs)
    const bots = readJson<SkillPack[]>(KEY_BOTS, [])
    const local = bots.find((b) => !b.isDemo)
    if (local) return creators.find((c) => c.id === local.creatorId) ?? null
    return creators[0] ?? null
  }
  return (
    creators.find(
      (c) =>
        c.id === handleOrId ||
        c.handle.toLowerCase() === handleOrId.toLowerCase(),
    ) ?? null
  )
}

export function marketBrowseSummary(): string {
  const bots = listSkillPacks()
  const active = getActiveBot()
  const follows = getFollows()
  const lines = [
    `**Skill Market** — ${bots.length} packs`,
    '',
    ...bots.slice(0, 8).map((b) => {
      const star = b.featured ? '★ ' : ''
      const fol = follows.followedIds.includes(b.id) ? ' · following' : ''
      const prim = active?.id === b.id ? ' · **primary**' : ''
      return `• ${star}**${b.name}** (${b.authorHandle}) — ${b.skillTags.slice(0, 3).join(', ')} · ★${b.rating} · ${b.followerCount} followers${fol}${prim}`
    }),
    '',
    'Open **#/skills** to follow / unfollow / publish. Demo ledger until RH DEX fee split.',
  ]
  return lines.join('\n')
}
