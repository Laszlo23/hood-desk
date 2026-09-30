import { isAddress, type Address } from 'viem'

const clean = (raw: unknown) =>
  String(raw || '')
    .trim()
    .replace(/^['"]|['"]$/g, '')

const raw = clean(import.meta.env.VITE_HOOD_TOKEN)

/** Optional $HOOD address from env. Empty / invalid → not deployed yet. */
export const HOOD_TOKEN_ADDRESS: Address | null =
  raw && isAddress(raw) ? (raw as Address) : null

export const HOOD_TOKEN_DEPLOYED = Boolean(HOOD_TOKEN_ADDRESS)

export const HOOD_META = {
  name: 'HOOD',
  symbol: 'HOOD',
  decimals: 18,
  totalSupplyNote: '1,000,000,000 HOOD (1B fixed supply, mint-once)',
} as const

/** Minimal ERC-20 ABI for balanceOf / decimals / symbol / name */
export const erc20Abi = [
  {
    type: 'function',
    name: 'balanceOf',
    stateMutability: 'view',
    inputs: [{ name: 'account', type: 'address' }],
    outputs: [{ name: '', type: 'uint256' }],
  },
  {
    type: 'function',
    name: 'decimals',
    stateMutability: 'view',
    inputs: [],
    outputs: [{ name: '', type: 'uint8' }],
  },
  {
    type: 'function',
    name: 'symbol',
    stateMutability: 'view',
    inputs: [],
    outputs: [{ name: '', type: 'string' }],
  },
  {
    type: 'function',
    name: 'name',
    stateMutability: 'view',
    inputs: [],
    outputs: [{ name: '', type: 'string' }],
  },
] as const
