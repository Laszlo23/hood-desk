/**
 * DogiHood — featured ERC-721 pack pride on Robinhood Chain (4663).
 * OpenSea: https://opensea.io/collection/dogihood
 * Contract confirmed via OpenSea HTML + on-chain name/symbol/supportsInterface.
 */

import { createPublicClient, http, type Address } from 'viem'
import { RH_RPC, robinhoodChain, EXPLORER_TOKEN } from '../chain'

const clean = (raw: unknown) =>
  String(raw || '')
    .trim()
    .replace(/^['"]|['"]$/g, '')

/** Confirmed DogiHood ERC-721 (ERC721-C / EIP-1167 proxy) on RH 4663 — not DIH ERC-20. */
export const DOGIHOOD_NFT_CONFIRMED = '0x9273f6d13c45a18c9664cecf0e7ff1f7aa9440fa' as const

/** Env override wins when set; otherwise the confirmed OpenSea contract. */
export const DOGIHOOD_NFT_ADDRESS: Address | null = (() => {
  const fromEnv = clean(import.meta.env.VITE_DOGIHOOD_NFT)
  if (fromEnv && /^0x[a-fA-F0-9]{40}$/.test(fromEnv)) return fromEnv as Address
  return DOGIHOOD_NFT_CONFIRMED as Address
})()

export const DOGIHOOD_CHAIN_ID = 4663 as const

export const DOGIHOOD_OPENSEA = 'https://opensea.io/collection/dogihood'

/** Official DogiHood site (DNS live; TLS may still be settling). */
export const DOGIHOOD_SITE = 'https://doghood.aibusiness.fun'

export const DOGIHOOD_SAMPLE_TOKEN_ID = 445n

/**
 * Pack art for sample token 445 on confirmed ERC-721
 * 0x9273f6d13c45a18c9664cecf0e7ff1f7aa9440fa.
 * Prefer local asset — previous OpenSea CDN path referenced a different
 * robinhood contract (0xd9e8758f…) and must not be invented for this one.
 */
export const DOGIHOOD_SAMPLE_IMAGE = '/nfts/dogihood-445.avif'

export const DOGIHOOD_LOCAL_IMAGE = '/nfts/dogihood-445.avif'
export const DOGIHOOD_PLACEHOLDER_SVG = '/nfts/dogihood-placeholder.svg'

export type DogiHoodCollection = {
  id: 'dogihood'
  name: string
  symbol: string
  tagline: string
  description: string
  openseaUrl: string
  siteUrl: string
  contract: Address | null
  chainId: number
  standard: 'ERC-721'
  badges: string[]
  sampleTokenId: number
  sampleImage: string
  localImage: string
  placeholderImage: string
  explorerUrl: string | null
}

export const DOGIHOOD: DogiHoodCollection = {
  id: 'dogihood',
  name: 'DogiHood',
  symbol: 'DOGI',
  tagline: 'Pixel Shibas on Robinhood Chain',
  description:
    'DogiHood is a pack of pixel Shibas roaming Robinhood Chain. No promises — clean pixel art, good vibes, dogs on-chain. Mint your Shiba, join the pack, enjoy the ride.',
  openseaUrl: DOGIHOOD_OPENSEA,
  siteUrl: DOGIHOOD_SITE,
  contract: DOGIHOOD_NFT_ADDRESS,
  chainId: DOGIHOOD_CHAIN_ID,
  standard: 'ERC-721',
  badges: ['Pack pride', 'Dogiflow+'],
  sampleTokenId: Number(DOGIHOOD_SAMPLE_TOKEN_ID),
  sampleImage: DOGIHOOD_SAMPLE_IMAGE,
  localImage: DOGIHOOD_LOCAL_IMAGE,
  placeholderImage: DOGIHOOD_PLACEHOLDER_SVG,
  explorerUrl: DOGIHOOD_NFT_ADDRESS ? EXPLORER_TOKEN(DOGIHOOD_NFT_ADDRESS) : null,
}

export const FEATURED_NFT_COLLECTIONS: DogiHoodCollection[] = [DOGIHOOD]

const erc721BalanceAbi = [
  {
    type: 'function',
    name: 'balanceOf',
    stateMutability: 'view',
    inputs: [{ name: 'owner', type: 'address' }],
    outputs: [{ name: '', type: 'uint256' }],
  },
] as const

const MANUAL_HOLD_KEY = 'hood-desk:dogihood:manual-hold:v1'

function publicClient() {
  return createPublicClient({
    chain: robinhoodChain,
    transport: http(RH_RPC),
  })
}

/** On-chain balanceOf when contract is known; null on RPC / address failure. */
export async function fetchDogiHoodBalance(owner: string): Promise<bigint | null> {
  const contract = DOGIHOOD_NFT_ADDRESS
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

export function getManualDogiHoodHold(): boolean {
  try {
    return localStorage.getItem(MANUAL_HOLD_KEY) === '1'
  } catch {
    return false
  }
}

export function setManualDogiHoodHold(on: boolean): void {
  try {
    if (on) localStorage.setItem(MANUAL_HOLD_KEY, '1')
    else localStorage.removeItem(MANUAL_HOLD_KEY)
  } catch {
    /* ignore */
  }
}

export type DogiHoodHoldStatus = {
  holding: boolean
  balance: bigint | null
  source: 'onchain' | 'manual' | 'none'
  contract: Address | null
}

/**
 * Holder check: prefer balanceOf via public RPC; fall back to localStorage
 * "I hold DogiHood" toggle when RPC fails or wallet disconnected.
 */
export async function resolveDogiHoodHold(owner?: string | null): Promise<DogiHoodHoldStatus> {
  const contract = DOGIHOOD_NFT_ADDRESS
  if (owner && contract) {
    const bal = await fetchDogiHoodBalance(owner)
    if (bal !== null) {
      return {
        holding: bal > 0n,
        balance: bal,
        source: 'onchain',
        contract,
      }
    }
  }
  const manual = getManualDogiHoodHold()
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

export function dogiHoodItemUrl(tokenId: number | string = DOGIHOOD.sampleTokenId): string {
  const c = DOGIHOOD_NFT_ADDRESS || DOGIHOOD_NFT_CONFIRMED
  return `https://opensea.io/item/robinhood/${c}/${tokenId}`
}

/** Tiny helper for eth_call debugging / tests. */
export const DOGIHOOD_IMPL_HINT = '0x09a26fc8fcef18192e267d7a6da9dfb4be81dd6a' as const
