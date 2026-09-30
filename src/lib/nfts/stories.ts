/**
 * Hood Street / $CCFF00 NFT project stories + gallery sources.
 * Only confirmed collections — no invented contracts or fake verified badges.
 *
 * Sources (Sep 2026):
 * - hoodstreet.capital — CCFF00 founding ERC-6551 membership ("Proof of Neon")
 * - OpenSea ccff00-161927574 + on-chain name/symbol/totalSupply via RH RPC
 * - OpenSea dogihood + contract 0x9273…40fa (existing DogiHood feature)
 * - Robinscout / Blockscout for explorer links
 *
 * ERC-20 note: several similarly named CCFF00 tokens exist on RH 4663.
 * HoodStreet docs say each NFT TBA received 10,000 $CCFF00 at mint.
 * Do NOT claim live trading — transfers may be disabled / markets unclear.
 * User hint 0x73cb…ec97 could not be independently confirmed — omitted.
 */

import type { Address } from 'viem'
import { EXPLORER_TOKEN } from '../chain'
import {
  DOGIHOOD,
  DOGIHOOD_NFT_ADDRESS,
  DOGIHOOD_OPENSEA,
  dogiHoodItemUrl,
  shortAddr,
} from './dogihood'

export type StoryConfidence = 'confirmed' | 'community-lore'

export type NftGalleryItem = {
  id: string
  collectionId: string
  label: string
  tokenId: number | string
  image: string
  placeholder?: string
  openseaItemUrl?: string
  note?: string
}

export type NftProjectStory = {
  id: string
  name: string
  tagline: string
  /** Short story card copy — why it matters / values / CCFF00 link */
  story: string
  confidence: StoryConfidence
  confidenceNote: string
  badges: string[]
  standard: string
  chainId: number
  contract: Address | null
  /** Optional ERC-20 related note — never a trading claim */
  erc20Note?: string
  sampleTokenId?: number
  coverImage: string
  gallery: NftGalleryItem[]
  links: { label: string; href: string }[]
  flagship?: boolean
  sources: string[]
}

/** Confirmed CCFF00 / Proof of Neon founding membership NFT (ERC-721 + ERC-6551 TBA). */
export const CCFF00_NFT_ADDRESS =
  '0x505a22ffed8d37ebe580ffd98d2cdb0021189146' as Address

export const CCFF00_OPENSEA = 'https://opensea.io/collection/ccff00-161927574'
export const CCFF00_SITE = 'https://hoodstreet.capital/ccff00'
export const CCFF00_HOODSTREET = 'https://hoodstreet.capital/'

/**
 * One of several similarly named ERC-20s on RH (name/symbol #ccff00, 1B supply).
 * Listed as reference only — not a live trading recommendation.
 * Robinscout: https://robinscout.gitlawb.com/token/0x899c0d46b93e6cc016230d0be82470f4f189ed23
 */
export const CCFF00_ERC20_REFERENCE =
  '0x899c0d46b93e6cc016230d0be82470f4f189ed23' as Address

export function ccff00ItemUrl(tokenId: number | string = 1): string {
  return `https://opensea.io/item/robinhood/${CCFF00_NFT_ADDRESS}/${tokenId}`
}

const CCFF00_GALLERY: NftGalleryItem[] = [
  {
    id: 'ccff00-1',
    collectionId: 'ccff00',
    label: '#CCFF00 · Square #1',
    tokenId: 1,
    image: '/nfts/ccff00-1.svg',
    openseaItemUrl: ccff00ItemUrl(1),
    note: 'On-chain SVG neon square (tokenURI data URI)',
  },
  {
    id: 'ccff00-42',
    collectionId: 'ccff00',
    label: '#CCFF00 · Square #42',
    tokenId: 42,
    image: '/nfts/ccff00-42.svg',
    openseaItemUrl: ccff00ItemUrl(42),
  },
  {
    id: 'ccff00-1000',
    collectionId: 'ccff00',
    label: '#CCFF00 · Square #1000',
    tokenId: 1000,
    image: '/nfts/ccff00-1000.svg',
    openseaItemUrl: ccff00ItemUrl(1000),
  },
]

const DOGIHOOD_GALLERY: NftGalleryItem[] = [
  {
    id: 'dogihood-445',
    collectionId: 'dogihood',
    label: 'DogiHood #445',
    tokenId: 445,
    image: '/nfts/dogihood-445.png',
    placeholder: '/nfts/dogihood-445.avif',
    openseaItemUrl: dogiHoodItemUrl(445),
    note: 'Sample token featured on Hood Desk',
  },
  {
    id: 'dogihood-42',
    collectionId: 'dogihood',
    label: 'DogiHood #42',
    tokenId: 42,
    image: '/nfts/dogihood-42.png',
    placeholder: '/nfts/dogihood-placeholder.svg',
    openseaItemUrl: dogiHoodItemUrl(42),
  },
  {
    id: 'dogihood-777',
    collectionId: 'dogihood',
    label: 'DogiHood #777',
    tokenId: 777,
    image: '/nfts/dogihood-777.png',
    placeholder: '/nfts/dogihood-placeholder.svg',
    openseaItemUrl: dogiHoodItemUrl(777),
  },
  {
    id: 'dogihood-1000',
    collectionId: 'dogihood',
    label: 'DogiHood #1000',
    tokenId: 1000,
    image: '/nfts/dogihood-1000.png',
    placeholder: '/nfts/dogihood-placeholder.svg',
    openseaItemUrl: dogiHoodItemUrl(1000),
  },
]

export const CCFF00_STORY: NftProjectStory = {
  id: 'ccff00',
  name: 'CCFF00 · Proof of Neon',
  tagline: 'HoodStreet founding membership — the NFT is the wallet',
  story:
    'Wall Street was built for institutions. HoodStreet builds onchain for humans and AI agents. CCFF00 is the founding ERC-6551 token-bound membership collection: every Square is its own wallet and, at mint, received 10,000 $CCFF00 inside that TBA. Neon identity, fixed 10,000 Squares, on-chain SVG art — membership as culture, not a fake verified stamp.',
  confidence: 'confirmed',
  confidenceNote:
    'Confirmed via hoodstreet.capital + OpenSea collection + on-chain name/symbol/supply (10,000).',
  badges: ['HoodStreet', 'ERC-6551 TBA', 'Neon #CCFF00'],
  standard: 'ERC-721 + ERC-6551',
  chainId: 4663,
  contract: CCFF00_NFT_ADDRESS,
  erc20Note:
    'Docs: each TBA loaded with 10,000 $CCFF00 at mint (1B fixed from 10k×10k). Multiple similarly named ERC-20 contracts exist on RH — trading may be disabled; we do not claim a live market. Reference explorer token #ccff00 (0x899c…ed23) is listed only as a community pointer, not a buy signal.',
  sampleTokenId: 1,
  coverImage: '/nfts/ccff00-1.svg',
  gallery: CCFF00_GALLERY,
  links: [
    { label: 'OpenSea', href: CCFF00_OPENSEA },
    { label: 'hoodstreet.capital', href: CCFF00_SITE },
    { label: 'HoodStreet home', href: CCFF00_HOODSTREET },
    { label: 'Sample #1', href: ccff00ItemUrl(1) },
    { label: 'Explorer NFT', href: EXPLORER_TOKEN(CCFF00_NFT_ADDRESS) },
    { label: 'ERC-20 ref (explorer)', href: EXPLORER_TOKEN(CCFF00_ERC20_REFERENCE) },
  ],
  sources: [
    'https://hoodstreet.capital/ccff00',
    'https://opensea.io/collection/ccff00-161927574',
    `RH RPC name/symbol/totalSupply @ ${CCFF00_NFT_ADDRESS}`,
  ],
}

export const DOGIHOOD_STORY: NftProjectStory = {
  id: 'dogihood',
  name: DOGIHOOD.name,
  tagline: DOGIHOOD.tagline,
  story:
    'DogiHood is Hood Desk’s flagship pack pride: pixel Shibas roaming Robinhood Chain. No promises — clean art, good vibes, dogs on-chain. Dogiflow+ labels the culture lane next to the HOOD agent fox. Sample token #445 stays the desk mascot NFT; holder checks use on-chain balanceOf when RPC answers.',
  confidence: 'confirmed',
  confidenceNote:
    'Confirmed OpenSea collection + on-chain DogiHood / DOGI @ 0x9273…40fa. Featured as Dogiflow+ on this desk.',
  badges: ['Flagship', 'Pack pride', 'Dogiflow+'],
  standard: DOGIHOOD.standard,
  chainId: DOGIHOOD.chainId,
  contract: DOGIHOOD_NFT_ADDRESS,
  sampleTokenId: DOGIHOOD.sampleTokenId,
  coverImage: '/nfts/dogihood-445.png',
  gallery: DOGIHOOD_GALLERY,
  flagship: true,
  links: [
    { label: 'OpenSea', href: DOGIHOOD_OPENSEA },
    { label: 'Sample #445', href: dogiHoodItemUrl(445) },
    ...(DOGIHOOD.explorerUrl
      ? [{ label: 'Explorer', href: DOGIHOOD.explorerUrl }]
      : []),
    { label: 'Site', href: DOGIHOOD.siteUrl },
  ],
  sources: [
    'https://opensea.io/collection/dogihood',
    `RH RPC @ ${DOGIHOOD_NFT_ADDRESS}`,
    'Local cache: public/nfts/dogihood-*.png (IPFS via Pinata gateway)',
  ],
}

/**
 * Ordered stories for the page. Only confirmed Hoodstreet / desk-supported packs.
 * DotHood and other RH collections exist but are NOT claimed as Hoodstreet-supported here.
 */
export const NFT_PROJECT_STORIES: NftProjectStory[] = [DOGIHOOD_STORY, CCFF00_STORY]

export const ALL_GALLERY_ITEMS: NftGalleryItem[] = NFT_PROJECT_STORIES.flatMap((s) => s.gallery)

export { shortAddr }
