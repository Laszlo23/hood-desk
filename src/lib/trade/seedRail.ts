import { type Address } from 'viem'
import { HOOD_TOKEN_CONFIRMED } from '../hoodToken'

/**
 * Pairs ETH with treasury $HOOD and adds both to position #1359889.
 * Deploy tx 0xdfed9843ebd6761bbcaba6a6a5c69411512966b365965fac51fa4f8cabbcca21.
 * Causes pot 0x0f1C048A7A6A8d400d1C8022D351FDd0c161719e holds 2% of each seed.
 * The contract cannot remove liquidity. Treasury match is capped at 100,000,000 HOOD.
 */
export const HOOD_SEED_RAIL: Address | null = '0xcA57278B5eD005B0BD321ce4838cA24BaDb76082'

/** Holds the 1–3% causes slice. Default rate on the rail is 2%. */
export const HOOD_CAUSES: Address = '0x0f1C048A7A6A8d400d1C8022D351FDd0c161719e'

export const HOOD_DEPLOYER: Address = '0x2CCf1076A9DCA4d656A156d6036Cc2066c596AF5'
export const HOOD_TOKEN_FOR_RAIL = HOOD_TOKEN_CONFIRMED

export const seedRailAbi = [
  {
    type: 'function',
    name: 'seed',
    stateMutability: 'payable',
    inputs: [],
    outputs: [],
  },
  {
    type: 'function',
    name: 'quoteSeed',
    stateMutability: 'view',
    inputs: [{ name: 'ethAmount', type: 'uint256' }],
    outputs: [
      { name: 'ethUsed', type: 'uint256' },
      { name: 'hoodPull', type: 'uint256' },
      { name: 'causesCut', type: 'uint256' },
    ],
  },
  {
    type: 'function',
    name: 'causes',
    stateMutability: 'view',
    inputs: [],
    outputs: [{ name: '', type: 'address' }],
  },
  {
    type: 'function',
    name: 'causesBps',
    stateMutability: 'view',
    inputs: [],
    outputs: [{ name: '', type: 'uint16' }],
  },
  {
    type: 'function',
    name: 'hoodBudget',
    stateMutability: 'view',
    inputs: [],
    outputs: [{ name: '', type: 'uint256' }],
  },
  {
    type: 'function',
    name: 'treasury',
    stateMutability: 'view',
    inputs: [],
    outputs: [{ name: '', type: 'address' }],
  },
  {
    type: 'function',
    name: 'owner',
    stateMutability: 'view',
    inputs: [],
    outputs: [{ name: '', type: 'address' }],
  },
  {
    type: 'function',
    name: 'paused',
    stateMutability: 'view',
    inputs: [],
    outputs: [{ name: '', type: 'bool' }],
  },
  {
    type: 'function',
    name: 'slippageBps',
    stateMutability: 'view',
    inputs: [],
    outputs: [{ name: '', type: 'uint16' }],
  },
  {
    type: 'function',
    name: 'setHoodBudget',
    stateMutability: 'nonpayable',
    inputs: [{ name: 'budget', type: 'uint256' }],
    outputs: [],
  },
] as const
