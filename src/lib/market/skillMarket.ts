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

const DROPPED_PACK_IDS = new Set([
  'bot_hood_community',
  'bot_hood_vet_pro',
  'bot_dca_desk',
  'bot_fair_scout',
  'bot_chart_hawk',
  'bot_neon_ops',
])

const DROPPED_CREATOR_IDS = new Set([
  'creator_leonardo',
  'creator_dca',
  'creator_scout',
  'creator_chart',
  'creator_neon',
  'creator_hood_agent',
])

function dropDemoCatalog(): void {
  const bots = readJson<SkillPack[] | null>(KEY_BOTS, null)
  if (bots) {
    const next = bots.filter((bot) => !bot.isDemo && !DROPPED_PACK_IDS.has(bot.id))
    if (next.length !== bots.length) writeJson(KEY_BOTS, next)
  }

  const creators = readJson<CreatorProfile[] | null>(KEY_CREATORS, null)
  if (creators) {
    const next = creators.filter((creator) => !DROPPED_CREATOR_IDS.has(creator.id))
    if (next.length !== creators.length) writeJson(KEY_CREATORS, next)
  }

  const follows = readJson<FollowState>(KEY_FOLLOWS, { followedIds: [] })
  const kept = follows.followedIds.filter((id) => !DROPPED_PACK_IDS.has(id))
  if (kept.length !== follows.followedIds.length) writeJson(KEY_FOLLOWS, { followedIds: kept })

  const active = readJson<string | null>(KEY_ACTIVE, null)
  if (active && DROPPED_PACK_IDS.has(active)) writeJson(KEY_ACTIVE, null)
}

export function listSkillPacks(): SkillPack[] {
  dropDemoCatalog()
  const bots = readJson<SkillPack[]>(KEY_BOTS, []).filter(
    (bot) => !bot.isDemo && !DROPPED_PACK_IDS.has(bot.id),
  )
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
  return [...bots, ...projectPacks].sort((a, b) => {
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
  dropDemoCatalog()
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
  dropDemoCatalog()
  return readJson<CreatorProfile[]>(KEY_CREATORS, []).filter(
    (creator) => !DROPPED_CREATOR_IDS.has(creator.id),
  )
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
      note: `Followed ${bot.authorHandle}`,
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

  dropDemoCatalog()
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
    note: `Published ${bot.name}`,
  })

  return {
    ok: true,
    bot,
    text: `Published **${bot.name}**. Saved in this browser. Following it changes Ask. It does not pay a trading fee.`,
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
    note: `Used ${bot.name}`,
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
      const crowd = b.isDemo ? 'question list' : `${b.followerCount} followers`
      return `• ${star}**${b.name}** (${b.authorHandle}) — ${b.skillTags.slice(0, 3).join(', ')} · ${crowd}${fol}${prim}`
    }),
    '',
    'Open **#/skills**. Follow copies the list into Ask. It does not place a swap.',
  ]
  return lines.join('\n')
}
