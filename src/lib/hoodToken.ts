import { isAddress, type Address } from 'viem'

const clean = (raw: unknown) =>
  String(raw || '')
    .trim()
    .replace(/^['"]|['"]$/g, '')

const raw = clean(import.meta.env.VITE_HOOD_TOKEN)

/**
 * Live $HOOD on Robinhood Chain 4663.
 * Deploy tx 0xe148725110ccf28f6411c90aac0de7b6cbe1708dc2c1e4d8dc9f8b305c97f26b.
 * Env override wins when it is a valid address. An empty env uses this contract.
 */
export const HOOD_TOKEN_CONFIRMED =
  '0xC7749BCFDC8d06FC246be556f4EAD75Ac7E1320c' as Address

/** Receipt status 0x1, block 76657830. This transaction created HOOD_TOKEN_CONFIRMED. */
export const HOOD_DEPLOY_TX =
  '0xe148725110ccf28f6411c90aac0de7b6cbe1708dc2c1e4d8dc9f8b305c97f26b' as const

/** $HOOD address. Invalid env override → unset. Empty env → confirmed contract. */
export const HOOD_TOKEN_ADDRESS: Address | null =
  raw && isAddress(raw) ? (raw as Address) : raw ? null : HOOD_TOKEN_CONFIRMED

export const HOOD_TOKEN_DEPLOYED = Boolean(HOOD_TOKEN_ADDRESS)

export const HOOD_META = {
  name: 'HOOD',
  symbol: 'HOOD',
  decimals: 18,
  totalSupplyNote: '1,000,000,000 HOOD (1B fixed supply, mint-once)',
} as const

/** Minimal ERC-20 ABI for balances, allowance, and approve. */
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
  {
    type: 'function',
    name: 'transfer',
    stateMutability: 'nonpayable',
    inputs: [
      { name: 'to', type: 'address' },
      { name: 'amount', type: 'uint256' },
    ],
    outputs: [{ name: '', type: 'bool' }],
  },
  {
    type: 'function',
    name: 'allowance',
    stateMutability: 'view',
    inputs: [
      { name: 'owner', type: 'address' },
      { name: 'spender', type: 'address' },
    ],
    outputs: [{ name: '', type: 'uint256' }],
  },
  {
    type: 'function',
    name: 'approve',
    stateMutability: 'nonpayable',
    inputs: [
      { name: 'spender', type: 'address' },
      { name: 'amount', type: 'uint256' },
    ],
    outputs: [{ name: '', type: 'bool' }],
  },
] as const
