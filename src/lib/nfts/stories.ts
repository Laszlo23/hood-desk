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
 * Official $CCFF00 is 0x73CB…ec97 (HoodStreet app + 10,000 tokens inside NFT #1's TBA).
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
import {
  HOOD_SEEDER,
  HOOD_SEEDER_NFT_ADDRESS,
  hoodSeederItemUrl,
} from './hoodseeder'
import { CCFF00_TOKEN_ADDRESS } from './tokenBound'

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
 * Official $CCFF00 from the HoodStreet app.
 * NFT #1's ERC-6551 wallet holds 10,000 of this token on RH 4663.
 * Transfers may still be disabled during the public mint — not a buy signal.
 */
export const CCFF00_ERC20_REFERENCE = CCFF00_TOKEN_ADDRESS

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

const HOOD_SEEDER_GALLERY: NftGalleryItem[] = [
  {
    id: 'hood-seeder-1',
    collectionId: 'hood-seeder',
    label: 'Hood Seeder #1',
    tokenId: 1,
    image: '/nfts/hood-seeder/1.svg',
    placeholder: '/nfts/hood-seeder/placeholder.svg',
    openseaItemUrl: HOOD_SEEDER_NFT_ADDRESS ? hoodSeederItemUrl(1) : undefined,
    note: 'Pass #1 is minted. The desk wallet mints the rest.',
  },
  {
    id: 'hood-seeder-42',
    collectionId: 'hood-seeder',
    label: 'Hood Seeder #42',
    tokenId: 42,
    image: '/nfts/hood-seeder/42.svg',
    placeholder: '/nfts/hood-seeder/placeholder.svg',
    openseaItemUrl: HOOD_SEEDER_NFT_ADDRESS ? hoodSeederItemUrl(42) : undefined,
  },
  {
    id: 'hood-seeder-100',
    collectionId: 'hood-seeder',
    label: 'Hood Seeder #100',
    tokenId: 100,
    image: '/nfts/hood-seeder/100.svg',
    placeholder: '/nfts/hood-seeder/placeholder.svg',
    openseaItemUrl: HOOD_SEEDER_NFT_ADDRESS ? hoodSeederItemUrl(100) : undefined,
    note: 'Legendary seeder',
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
    'Each TBA was loaded with 10,000 official $CCFF00 at mint (0x73CB…ec97). Hood Desk reads that balance live. Transfers may stay disabled until the public mint finishes — not a buy signal.',
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

export const HOOD_SEEDER_STORY: NftProjectStory = {
  id: 'hood-seeder',
  name: HOOD_SEEDER.name,
  tagline: HOOD_SEEDER.tagline,
  story:
    'Hood Seeder Pass honors early supporters who help seed $HOOD liquidity on Robinhood Chain. Robin Hood / forest / fox theme with #CCFF00 accent. The desk wallet mints each pass, up to 3,333. The $HOOD drip stays off until the desk enables it.',
  confidence: 'community-lore',
  confidenceNote: HOOD_SEEDER_NFT_ADDRESS
    ? `Hood Desk collection. Live at ${shortAddr(HOOD_SEEDER_NFT_ADDRESS)}. The desk wallet mints the next pass.`
    : 'Hood Desk collection. The contract address is not set on this desk.',
  badges: ['Seeder Pass', 'Forest Guardian', 'Early Supporter'],
  standard: HOOD_SEEDER.standard,
  chainId: HOOD_SEEDER.chainId,
  contract: HOOD_SEEDER_NFT_ADDRESS,
  erc20Note:
    'The $HOOD drip on this pass stays off. The pool is separate from the pass.',
  sampleTokenId: HOOD_SEEDER.sampleTokenId,
  coverImage: '/nfts/hood-seeder/1.svg',
  gallery: HOOD_SEEDER_GALLERY,
  links: [
    ...(HOOD_SEEDER_NFT_ADDRESS
      ? [
          { label: 'Sample #1', href: hoodSeederItemUrl(1) },
          { label: 'Explorer', href: HOOD_SEEDER.explorerUrl || '#' },
        ]
      : []),
    { label: 'Deploy guide', href: 'https://github.com/Laszlo23/hood-desk#hood-seeder-nft' },
  ],
  sources: [
    'Hood Desk repo: contracts/hood-seeder/',
    'Sample art: public/nfts/hood-seeder/*.svg',
    HOOD_SEEDER_NFT_ADDRESS ? `Deployed @ ${HOOD_SEEDER_NFT_ADDRESS}` : 'Not yet deployed',
  ],
}

/**
 * Ordered stories for the page. Only confirmed Hoodstreet / desk-supported packs.
 * DotHood and other RH collections exist but are NOT claimed as Hoodstreet-supported here.
 */
export const NFT_PROJECT_STORIES: NftProjectStory[] = [DOGIHOOD_STORY, HOOD_SEEDER_STORY, CCFF00_STORY]

/** Holder Airdrop NFT (ERC-1155 token id 1) — featured on NFT page */
export const HOLDER_AIRDROP_NFT_ADDRESS = '0x019695A94464E8C6252f03e58980DEa550c2A19A' as Address
export const HOLDER_AIRDROP_TOKEN_ID = 1
export const HOLDER_AIRDROP_BLOCKSCOUT = `https://robinhoodchain.blockscout.com/token/${HOLDER_AIRDROP_NFT_ADDRESS}/instance/${HOLDER_AIRDROP_TOKEN_ID}`
export const HOLDER_AIRDROP_IMAGE_IPFS = 'ipfs://bafybeifvjldimueb2renkfkhneqvmxmooalpg67o6d5tfebxffign6kfhu'

export const ALL_GALLERY_ITEMS: NftGalleryItem[] = NFT_PROJECT_STORIES.flatMap((s) => s.gallery)

export { shortAddr }
