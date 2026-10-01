/**
 * Inner Circle SBT — soulbound membership badge for Hood Desk on Robinhood Chain (4663).
 * Contract: contracts/src/InnerCircleSBT.sol
 * Soulbound (non-transferable), owner-only mint, on-chain SVG metadata.
 */

import { createPublicClient, http, type Address } from 'viem'
import { RH_RPC, robinhoodChain, EXPLORER_TOKEN } from '../chain'

const clean = (raw: unknown) =>
  String(raw || '')
    .trim()
    .replace(/^['"]|['"]$/g, '')

/** Inner Circle SBT address from env (optional until deployed). */
export const INNER_CIRCLE_SBT_ADDRESS: Address | null = (() => {
  const fromEnv = clean(import.meta.env.VITE_INNER_CIRCLE_SBT)
  if (fromEnv && /^0x[a-fA-F0-9]{40}$/.test(fromEnv)) return fromEnv as Address
  return null
})()

export const INNER_CIRCLE_CHAIN_ID = 4663 as const

export type InnerCircleCollection = {
  id: 'inner-circle'
  name: string
  symbol: string
  tagline: string
  description: string
  contract: Address | null
  chainId: number
  standard: 'ERC-721 (Soulbound)'
  badges: string[]
  explorerUrl: string | null
}

export const INNER_CIRCLE: InnerCircleCollection = {
  id: 'inner-circle',
  name: 'Hood Desk Inner Circle',
  symbol: 'HDIC',
  tagline: 'Soulbound membership badge',
  description:
    'Non-transferable proof of Hood Desk Inner Circle membership on Robinhood Chain. Soulbound token — no transfers after mint. Culture first, no promises.',
  contract: INNER_CIRCLE_SBT_ADDRESS,
  chainId: INNER_CIRCLE_CHAIN_ID,
  standard: 'ERC-721 (Soulbound)',
  badges: ['Soulbound', 'Owner mint'],
  explorerUrl: INNER_CIRCLE_SBT_ADDRESS ? EXPLORER_TOKEN(INNER_CIRCLE_SBT_ADDRESS) : null,
}

const erc721BalanceAbi = [
  {
    type: 'function',
    name: 'balanceOf',
    stateMutability: 'view',
    inputs: [{ name: 'owner', type: 'address' }],
    outputs: [{ name: '', type: 'uint256' }],
  },
] as const

const MANUAL_HOLD_KEY = 'hood-desk:inner-circle:manual-hold:v1'

function publicClient() {
  return createPublicClient({
    chain: robinhoodChain,
    transport: http(RH_RPC),
  })
}

/** On-chain balanceOf when contract is known; null on RPC / address failure. */
export async function fetchInnerCircleBalance(owner: string): Promise<bigint | null> {
  const contract = INNER_CIRCLE_SBT_ADDRESS
  if (!contract) return null
  const a = owner?.trim()
  if (!a || !/^0x[a-fA-F0-9]{40}$/.test(a)) return null
  try {
    const bal = await publicClient().readContract({
      address: contract,
      abi: erc721BalanceAbi,
      functionName: 'balanceOf',
      args: [a as Address],
    })
    return bal as bigint
  } catch {
    return null
  }
}

export function getManualInnerCircleHold(): boolean {
  try {
    return localStorage.getItem(MANUAL_HOLD_KEY) === '1'
  } catch {
    return false
  }
}

export function setManualInnerCircleHold(on: boolean): void {
  try {
    if (on) localStorage.setItem(MANUAL_HOLD_KEY, '1')
    else localStorage.removeItem(MANUAL_HOLD_KEY)
  } catch {
    /* ignore */
  }
}

export type InnerCircleHoldStatus = {
  holding: boolean
  balance: bigint | null
  source: 'onchain' | 'manual' | 'none'
  contract: Address | null
}

/**
 * Holder check: prefer balanceOf via public RPC; fall back to localStorage
 * manual toggle when RPC fails or wallet disconnected.
 */
export async function resolveInnerCircleHold(owner?: string | null): Promise<InnerCircleHoldStatus> {
  const contract = INNER_CIRCLE_SBT_ADDRESS
  if (owner && contract) {
    const bal = await fetchInnerCircleBalance(owner)
    if (bal !== null) {
      return {
        holding: bal > 0n,
        balance: bal,
        source: 'onchain',
        contract,
      }
    }
  }
  const manual = getManualInnerCircleHold()
  return {
    holding: manual,
    balance: null,
    source: manual ? 'manual' : 'none',
    contract,
  }
}

/** Short address for UI. */
export function shortAddr(addr: string | null | undefined): string {
  if (!addr || addr.length < 10) return addr || '—'
  return `${addr.slice(0, 6)}…${addr.slice(-4)}`
}
