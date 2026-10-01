/**
 * Hood Seeder — early supporter NFT collection on Robinhood Chain (4663).
 * Theme: Robin Hood / forest / fox / #CCFF00 accent.
 * Utility: ERC-721 with optional future $HOOD claim stub (off by default).
 */

import { createPublicClient, http, type Address } from 'viem'
import { RH_RPC, robinhoodChain, EXPLORER_TOKEN } from '../chain'

const clean = (raw: unknown) =>
  String(raw || '')
    .trim()
    .replace(/^['"]|['"]$/g, '')

/** Env-configured Hood Seeder contract address (deploy then set VITE_HOOD_SEEDER_NFT). */
export const HOOD_SEEDER_NFT_ADDRESS: Address | null = (() => {
  const fromEnv = clean(import.meta.env.VITE_HOOD_SEEDER_NFT)
  if (fromEnv && /^0x[a-fA-F0-9]{40}$/.test(fromEnv)) return fromEnv as Address
  return null
})()

export const HOOD_SEEDER_CHAIN_ID = 4663 as const

export const HOOD_SEEDER_SAMPLE_TOKEN_ID = 1n

export const HOOD_SEEDER_SAMPLE_IMAGE = '/nfts/hood-seeder/1.svg'
export const HOOD_SEEDER_PLACEHOLDER_SVG = '/nfts/hood-seeder/placeholder.svg'

export type HoodSeederCollection = {
  id: 'hood-seeder'
  name: string
  symbol: string
  tagline: string
  description: string
  siteUrl: string | null
  contract: Address | null
  chainId: number
  standard: 'ERC-721'
  badges: string[]
  sampleTokenId: number
  sampleImage: string
  placeholderImage: string
  explorerUrl: string | null
  maxSupply: number
}

export const HOOD_SEEDER: HoodSeederCollection = {
  id: 'hood-seeder',
  name: 'Hood Seeder',
  symbol: 'HSEED',
  tagline: 'Early supporters who seed $HOOD liquidity',
  description:
    'Hood Seeder Pass recognizes early supporters who help seed $HOOD liquidity on Robinhood Chain. Robin Hood / forest / fox themed with #CCFF00 accent. On-chain lore: holder "seeded the desk". Future utility may include $HOOD drip claim (off by default until owner enables + funds).',
  siteUrl: null,
  contract: HOOD_SEEDER_NFT_ADDRESS,
  chainId: HOOD_SEEDER_CHAIN_ID,
  standard: 'ERC-721',
  badges: ['Seeder Pass', 'Forest Guardian', 'Early Supporter'],
  sampleTokenId: Number(HOOD_SEEDER_SAMPLE_TOKEN_ID),
  sampleImage: HOOD_SEEDER_SAMPLE_IMAGE,
  placeholderImage: HOOD_SEEDER_PLACEHOLDER_SVG,
  explorerUrl: HOOD_SEEDER_NFT_ADDRESS ? EXPLORER_TOKEN(HOOD_SEEDER_NFT_ADDRESS) : null,
  maxSupply: 3333,
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

const MANUAL_HOLD_KEY = 'hood-desk:hood-seeder:manual-hold:v1'

function publicClient() {
  return createPublicClient({
    chain: robinhoodChain,
    transport: http(RH_RPC),
  })
}

export async function fetchHoodSeederBalance(owner: string): Promise<bigint | null> {
  const contract = HOOD_SEEDER_NFT_ADDRESS
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

export function getManualHoodSeederHold(): boolean {
  try {
    return localStorage.getItem(MANUAL_HOLD_KEY) === '1'
  } catch {
    return false
  }
}

export function setManualHoodSeederHold(on: boolean): void {
  try {
    if (on) localStorage.setItem(MANUAL_HOLD_KEY, '1')
    else localStorage.removeItem(MANUAL_HOLD_KEY)
  } catch {
    /* ignore */
  }
}

export type HoodSeederHoldStatus = {
  holding: boolean
  balance: bigint | null
  source: 'onchain' | 'manual' | 'none'
  contract: Address | null
}

export async function resolveHoodSeederHold(owner?: string | null): Promise<HoodSeederHoldStatus> {
  const contract = HOOD_SEEDER_NFT_ADDRESS
  if (owner && contract) {
    const bal = await fetchHoodSeederBalance(owner)
    if (bal !== null) {
      return {
        holding: bal > 0n,
        balance: bal,
        source: 'onchain',
        contract,
      }
    }
  }
  const manual = getManualHoodSeederHold()
  return {
    holding: manual,
    balance: null,
    source: manual ? 'manual' : 'none',
    contract,
  }
}

export function hoodSeederItemUrl(tokenId: number | string = HOOD_SEEDER.sampleTokenId): string {
  if (!HOOD_SEEDER_NFT_ADDRESS) return '#'
  return `https://opensea.io/item/robinhood/${HOOD_SEEDER_NFT_ADDRESS}/${tokenId}`
}

export function shortAddr(addr: string | null | undefined): string {
  if (!addr || addr.length < 10) return addr || '—'
  return `${addr.slice(0, 6)}…${addr.slice(-4)}`
}
