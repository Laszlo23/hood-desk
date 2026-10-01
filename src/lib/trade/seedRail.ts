import { type Address } from 'viem'
import { HOOD_TOKEN_CONFIRMED } from '../hoodToken'

/**
 * Pairs ETH with treasury $HOOD and adds both to position #1359889.
 * Deploy tx 0x72832410c0b18b5ea2e612dc63c037cf10837cdaf7f2f97718fe60f77f0c6397.
 * The contract cannot remove liquidity. The treasury $HOOD budget starts at zero.
 */
export const HOOD_SEED_RAIL: Address | null =
  '0x5b6F402Caa976B459fE09077ee38C67E902154bb'

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
    ],
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
