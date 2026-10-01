/**
 * ERC-6551 token-bound accounts on Robinhood Chain (4663).
 *
 * Registry, account implementation, and salt match the HoodStreet CCFF00 app
 * (hoodstreet.capital). Checked on-chain: CCFF00 NFT #1's account is deployed
 * and holds 10,000 of the official $CCFF00 token.
 *
 * DogiHood uses the same registry so each Shiba has a deterministic wallet.
 * $HOOD is not preloaded there — a balance shows up only after a transfer
 * into that wallet.
 */

import type { Address, Hex } from 'viem'
import { DOGIHOOD_NFT_ADDRESS } from './dogihood'

/** Canonical ERC-6551 registry. Code is present on chain 4663. */
export const ERC6551_REGISTRY =
  '0x000000006551c19487814612e58FE06813775758' as Address

/** HoodStreet account implementation. Code is present on chain 4663. */
export const ERC6551_ACCOUNT_IMPLEMENTATION =
  '0x03dA8C9df253a4401b08629a6F50E4c4E8e248cC' as Address

/** Salt HoodStreet uses for every CCFF00 token-bound account. */
export const ERC6551_SALT =
  '0x448cc5ed5a52db42393a3d48476af932464724d8262648ad18b66d2ffef1a8e0' as Hex

export const ERC6551_CHAIN_ID = 4663n

/** Official $CCFF00 ERC-20 from the HoodStreet app config. */
export const CCFF00_TOKEN_ADDRESS =
  '0x73CB777311Dc5e464C53Ddafb4496Fd87fE0eC97' as Address

export const CCFF00_NFT_ADDRESS =
  '0x505A22Ffed8d37ebE580FfD98d2Cdb0021189146' as Address

export type BoundCollectionId = 'dogihood' | 'ccff00'

export type BoundCollection = {
  id: BoundCollectionId
  name: string
  nft: Address
  /** Sample token id known to exist. */
  sampleTokenId: bigint
  /** ERC-20 that mint already placed inside the NFT wallet, if any. */
  preloadedToken: Address | null
  preloadedSymbol: string | null
  preloadedNote: string
}

export const BOUND_COLLECTIONS: Record<BoundCollectionId, BoundCollection> = {
  dogihood: {
    id: 'dogihood',
    name: 'DogiHood',
    nft: (DOGIHOOD_NFT_ADDRESS ??
      '0x9273f6d13c45a18c9664cecf0e7ff1f7aa9440fa') as Address,
    sampleTokenId: 445n,
    preloadedToken: null,
    preloadedSymbol: null,
    preloadedNote:
      'DogiHood wallets are empty until someone sends $HOOD (or any RH token) into them. Nothing is preloaded.',
  },
  ccff00: {
    id: 'ccff00',
    name: 'CCFF00',
    nft: CCFF00_NFT_ADDRESS,
    sampleTokenId: 1n,
    preloadedToken: CCFF00_TOKEN_ADDRESS,
    preloadedSymbol: 'CCFF00',
    preloadedNote:
      'Each CCFF00 Square was minted with 10,000 $CCFF00 inside its own wallet. That balance is read live — not assumed.',
  },
}

export const erc6551RegistryAbi = [
  {
    type: 'function',
    name: 'account',
    stateMutability: 'view',
    inputs: [
      { name: 'implementation', type: 'address' },
      { name: 'salt', type: 'bytes32' },
      { name: 'chainId', type: 'uint256' },
      { name: 'tokenContract', type: 'address' },
      { name: 'tokenId', type: 'uint256' },
    ],
    outputs: [{ name: '', type: 'address' }],
  },
  {
    type: 'function',
    name: 'createAccount',
    stateMutability: 'nonpayable',
    inputs: [
      { name: 'implementation', type: 'address' },
      { name: 'salt', type: 'bytes32' },
      { name: 'chainId', type: 'uint256' },
      { name: 'tokenContract', type: 'address' },
      { name: 'tokenId', type: 'uint256' },
    ],
    outputs: [{ name: '', type: 'address' }],
  },
] as const

export const erc721OwnerAbi = [
  {
    type: 'function',
    name: 'ownerOf',
    stateMutability: 'view',
    inputs: [{ name: 'tokenId', type: 'uint256' }],
    outputs: [{ name: '', type: 'address' }],
  },
] as const

export function registryAccountArgs(nft: Address, tokenId: bigint) {
  return [
    ERC6551_ACCOUNT_IMPLEMENTATION,
    ERC6551_SALT,
    ERC6551_CHAIN_ID,
    nft,
    tokenId,
  ] as const
}
