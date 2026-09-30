/**
 * Token-creator + platform rewards — demo ledger (localStorage).
 * Wired from simulated Trade fills. Honest: never claims on-chain payouts.
 */

import { isAddress } from 'viem'
import { getActiveBot, getCreator } from '../market/skillMarket'
import { HOOD_DEMO_ADDRESS } from '../trade/demoTokens'
import type { SimulatedOrder } from '../trade/types'
import {
  PLATFORM_TREASURY_ID,
  PLATFORM_TREASURY_LABEL,
  REWARDS_DISCLAIMER,
  TRADE_FEE_SPLIT,
} from './config'

const KEY_LEDGER = 'hood-desk:rewards:ledger:v1'
const KEY_BALANCES = 'hood-desk:rewards:balances:v1'
const KEY_TOKEN_INDEX = 'hood-desk:rewards:token-creators:v1'

export type RewardRole = 'creator' | 'platform' | 'bot_referrer'

export type RewardEntry = {
  id: string
  at: string
  orderId: string
  tokenAddress: string
  tokenSymbol: string
  role: RewardRole
  beneficiaryId: string
  /** Human label (wallet short / handle / treasury) */
  beneficiaryLabel: string
  amount: number
  feeVolume: number
  note: string
}

export type RewardBalance = {
  id: string
  label: string
  role: RewardRole | 'mixed'
  credits: number
  updatedAt: string
}

export type TokenCreatorRecord = {
  tokenAddress: string
  tokenSymbol: string
  creatorAddress: string
  projectId?: string
  projectName?: string
  updatedAt: string
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

function shortAddr(a: string): string {
  if (!a || a.length < 10) return a
  return `${a.slice(0, 6)}…${a.slice(-4)}`
}

/** Seed HOOD demo token → Leonardo / platform demo creator so Rewards has a path. */
function ensureDemoCreators(): void {
  const index = listTokenCreators()
  const hood = HOOD_DEMO_ADDRESS.toLowerCase()
  if (!index.some((r) => r.tokenAddress.toLowerCase() === hood)) {
    index.push({
      tokenAddress: HOOD_DEMO_ADDRESS,
      tokenSymbol: 'HOOD',
      creatorAddress: '0xleonardo-demo-creator',
      projectName: 'Hood Street (demo)',
      updatedAt: new Date().toISOString(),
    })
    writeJson(KEY_TOKEN_INDEX, index)
  }
}

export function listTokenCreators(): TokenCreatorRecord[] {
  return readJson<TokenCreatorRecord[]>(KEY_TOKEN_INDEX, [])
}

export function getTokenCreator(tokenAddress: string): TokenCreatorRecord | undefined {
  ensureDemoCreators()
  const a = tokenAddress.toLowerCase()
  return listTokenCreators().find((r) => r.tokenAddress.toLowerCase() === a)
}

/** Call when attaching/publishing a fair-launch token so rewards know who to credit. */
export function registerTokenCreator(input: {
  tokenAddress: string
  tokenSymbol: string
  creatorAddress: string
  projectId?: string
  projectName?: string
}): TokenCreatorRecord {
  const cleaned = input.tokenAddress.trim()
  const creator = input.creatorAddress.trim() || 'anon'
  const now = new Date().toISOString()
  const record: TokenCreatorRecord = {
    tokenAddress: cleaned,
    tokenSymbol: input.tokenSymbol.toUpperCase(),
    creatorAddress: isAddress(creator) ? creator.toLowerCase() : creator,
    projectId: input.projectId,
    projectName: input.projectName,
    updatedAt: now,
  }
  const all = listTokenCreators().filter(
    (r) => r.tokenAddress.toLowerCase() !== cleaned.toLowerCase(),
  )
  all.unshift(record)
  writeJson(KEY_TOKEN_INDEX, all.slice(0, 200))
  return record
}

export function listRewardLedger(): RewardEntry[] {
  return readJson<RewardEntry[]>(KEY_LEDGER, []).sort((a, b) =>
    a.at < b.at ? 1 : -1,
  )
}

export function listRewardBalances(): RewardBalance[] {
  return readJson<RewardBalance[]>(KEY_BALANCES, [])
}

function creditBalance(
  id: string,
  label: string,
  role: RewardRole | 'mixed',
  amount: number,
): void {
  const all = listRewardBalances()
  const idx = all.findIndex((b) => b.id === id)
  const now = new Date().toISOString()
  if (idx >= 0) {
    all[idx] = {
      ...all[idx],
      label,
      credits: Math.round((all[idx].credits + amount) * 1e6) / 1e6,
      updatedAt: now,
      role: all[idx].role === role ? role : 'mixed',
    }
  } else {
    all.push({ id, label, role, credits: amount, updatedAt: now })
  }
  writeJson(KEY_BALANCES, all)
}

function appendEntry(entry: Omit<RewardEntry, 'id' | 'at'>): RewardEntry {
  const full: RewardEntry = {
    ...entry,
    id: uid('rew'),
    at: new Date().toISOString(),
  }
  const ledger = listRewardLedger()
  ledger.unshift(full)
  writeJson(KEY_LEDGER, ledger.slice(0, 300))
  creditBalance(full.beneficiaryId, full.beneficiaryLabel, full.role, full.amount)
  return full
}

/** Estimate demo notional (quote units) from order amount × optional price. */
function estimateNotional(order: SimulatedOrder): number {
  const amt = Number(order.amount)
  if (!(amt > 0)) return 0
  const px = order.price ? Number(order.price) : NaN
  if (px > 0) return amt * px
  if (order.side === 'buy') return amt
  return amt * 0.0001
}

export type AccrueResult = {
  ok: boolean
  feeVolume: number
  entries: RewardEntry[]
  reason?: string
}

/**
 * On simulated Trade fill: split fee volume per TRADE_FEE_SPLIT when token has a creator.
 */
export function accrueTradeRewards(order: SimulatedOrder): AccrueResult {
  ensureDemoCreators()
  if (order.status !== 'filled' && order.status !== 'simulated') {
    return { ok: false, feeVolume: 0, entries: [], reason: 'Order not fill-like' }
  }

  const creatorRec = getTokenCreator(order.tokenAddress)
  if (!creatorRec) {
    return {
      ok: false,
      feeVolume: 0,
      entries: [],
      reason: 'No creator registered for this token (demo ledger skips)',
    }
  }

  const notional = estimateNotional(order)
  const feeVolume =
    Math.round(notional * (TRADE_FEE_SPLIT.feeRatePct / 100) * 1e6) / 1e6
  if (!(feeVolume > 0)) {
    return { ok: false, feeVolume: 0, entries: [], reason: 'Zero fee volume' }
  }

  const creatorAmt =
    Math.round(feeVolume * (TRADE_FEE_SPLIT.creatorPct / 100) * 1e6) / 1e6
  const platformAmt =
    Math.round(feeVolume * (TRADE_FEE_SPLIT.platformPct / 100) * 1e6) / 1e6
  const botAmt =
    Math.round(feeVolume * (TRADE_FEE_SPLIT.botOrReferrerPct / 100) * 1e6) / 1e6

  const entries: RewardEntry[] = []

  entries.push(
    appendEntry({
      orderId: order.id,
      tokenAddress: order.tokenAddress,
      tokenSymbol: order.tokenSymbol,
      role: 'creator',
      beneficiaryId: `creator:${creatorRec.creatorAddress}`,
      beneficiaryLabel: isAddress(creatorRec.creatorAddress)
        ? shortAddr(creatorRec.creatorAddress)
        : creatorRec.creatorAddress,
      amount: creatorAmt,
      feeVolume,
      note: `Token creator share ${TRADE_FEE_SPLIT.creatorPct}% · ${order.tokenSymbol} (demo)`,
    }),
  )

  entries.push(
    appendEntry({
      orderId: order.id,
      tokenAddress: order.tokenAddress,
      tokenSymbol: order.tokenSymbol,
      role: 'platform',
      beneficiaryId: PLATFORM_TREASURY_ID,
      beneficiaryLabel: PLATFORM_TREASURY_LABEL,
      amount: platformAmt,
      feeVolume,
      note: `Platform treasury ${TRADE_FEE_SPLIT.platformPct}% · ${order.tokenSymbol} (demo)`,
    }),
  )

  const bot = getActiveBot()
  let botLabel = 'Desk (no active bot)'
  let botId = 'bot:none'
  if (bot) {
    const creator = getCreator(bot.creatorId)
    botLabel = creator?.handle || bot.authorHandle
    botId = `bot:${bot.creatorId}`
  }
  entries.push(
    appendEntry({
      orderId: order.id,
      tokenAddress: order.tokenAddress,
      tokenSymbol: order.tokenSymbol,
      role: 'bot_referrer',
      beneficiaryId: botId,
      beneficiaryLabel: botLabel,
      amount: botAmt,
      feeVolume,
      note: `Bot/referrer share ${TRADE_FEE_SPLIT.botOrReferrerPct}% via ${bot?.name ?? 'none'} (demo)`,
    }),
  )

  return { ok: true, feeVolume, entries }
}

export function getCreatorCredits(creatorAddress?: string | null): number {
  if (!creatorAddress) return 0
  const id = `creator:${isAddress(creatorAddress) ? creatorAddress.toLowerCase() : creatorAddress}`
  return listRewardBalances()
    .filter((b) => b.id === id || b.id.toLowerCase() === id.toLowerCase())
    .reduce((s, b) => s + b.credits, 0)
}

export function getPlatformTreasuryTotal(): number {
  return listRewardBalances().find((b) => b.id === PLATFORM_TREASURY_ID)?.credits ?? 0
}

export function recentTradesForCreator(
  creatorAddress?: string | null,
  limit = 20,
): RewardEntry[] {
  if (!creatorAddress) return []
  const needle = isAddress(creatorAddress)
    ? creatorAddress.toLowerCase()
    : creatorAddress
  const myTokens = new Set(
    listTokenCreators()
      .filter((r) => {
        const c = isAddress(r.creatorAddress)
          ? r.creatorAddress.toLowerCase()
          : r.creatorAddress
        return c === needle || r.creatorAddress === creatorAddress
      })
      .map((r) => r.tokenAddress.toLowerCase()),
  )
  return listRewardLedger()
    .filter(
      (e) =>
        e.role === 'creator' &&
        (myTokens.has(e.tokenAddress.toLowerCase()) ||
          e.beneficiaryId.toLowerCase().includes(needle.toLowerCase())),
    )
    .slice(0, limit)
}

export function rewardsSummaryCopy(): string {
  return [
    `Fee split (demo): creator ${TRADE_FEE_SPLIT.creatorPct}% / platform ${TRADE_FEE_SPLIT.platformPct}% / bot-or-referrer ${TRADE_FEE_SPLIT.botOrReferrerPct}%`,
    `Fee rate: ${TRADE_FEE_SPLIT.feeRatePct}% of simulated notional`,
    REWARDS_DISCLAIMER,
  ].join(' · ')
}

export { REWARDS_DISCLAIMER, TRADE_FEE_SPLIT, PLATFORM_TREASURY_LABEL }
