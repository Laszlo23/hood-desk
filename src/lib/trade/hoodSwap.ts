import { encodeFunctionData, parseUnits, type Address, type Hex } from 'viem'
import { HOOD_TOKEN_ADDRESS } from '../hoodToken'
import {
  UNISWAP_V3_ADDRESSES,
  WETH_ADDRESS,
  checkPoolExists,
  getQuote,
} from './uniswap'

/** 5% — the opening pool is thin, so a tight limit would revert on a normal size. */
export const HOOD_SWAP_SLIPPAGE_BPS = 500

const routerAbi = [
  {
    type: 'function',
    name: 'exactInputSingle',
    stateMutability: 'payable',
    inputs: [
      {
        name: 'params',
        type: 'tuple',
        components: [
          { name: 'tokenIn', type: 'address' },
          { name: 'tokenOut', type: 'address' },
          { name: 'fee', type: 'uint24' },
          { name: 'recipient', type: 'address' },
          { name: 'amountIn', type: 'uint256' },
          { name: 'amountOutMinimum', type: 'uint256' },
          { name: 'sqrtPriceLimitX96', type: 'uint160' },
        ],
      },
    ],
    outputs: [{ name: 'amountOut', type: 'uint256' }],
  },
  {
    type: 'function',
    name: 'unwrapWETH9',
    stateMutability: 'payable',
    inputs: [
      { name: 'amountMinimum', type: 'uint256' },
      { name: 'recipient', type: 'address' },
    ],
    outputs: [],
  },
  {
    type: 'function',
    name: 'multicall',
    stateMutability: 'payable',
    inputs: [
      { name: 'deadline', type: 'uint256' },
      { name: 'data', type: 'bytes[]' },
    ],
    outputs: [{ name: '', type: 'bytes[]' }],
  },
] as const

export type HoodSwapPlan = {
  side: 'buy' | 'sell'
  fee: number
  amountIn: bigint
  quotedOut: bigint
  minOut: bigint
  router: Address
  value: bigint
  data: Hex
  /** Set on sells so the wallet can approve SwapRouter02 before the swap. */
  approveAmount: bigint | null
}

export type HoodSwapPlanResult =
  | { ok: true; plan: HoodSwapPlan }
  | { ok: false; error: string }

function minOut(quoted: bigint): bigint {
  return (quoted * BigInt(10_000 - HOOD_SWAP_SLIPPAGE_BPS)) / 10_000n
}

/**
 * Build a wallet-signed Uniswap V3 market swap for the live $HOOD/WETH pool.
 * Buy spends ETH and receives $HOOD. Sell spends $HOOD and unwraps WETH back to ETH.
 */
export async function planHoodMarketSwap(input: {
  side: 'buy' | 'sell'
  amount: string
  recipient: Address
}): Promise<HoodSwapPlanResult> {
  const hood = HOOD_TOKEN_ADDRESS
  if (!hood) return { ok: false, error: '$HOOD is not configured.' }

  let amountIn: bigint
  try {
    amountIn = parseUnits(input.amount.trim(), 18)
  } catch {
    return { ok: false, error: 'Enter a valid amount.' }
  }
  if (amountIn <= 0n) return { ok: false, error: 'Enter an amount greater than zero.' }

  const pool = await checkPoolExists(hood, WETH_ADDRESS)
  if (!pool.exists || pool.fee == null) {
    return { ok: false, error: 'No $HOOD/WETH pool on Uniswap V3.' }
  }

  const tokenIn = input.side === 'buy' ? WETH_ADDRESS : hood
  const tokenOut = input.side === 'buy' ? hood : WETH_ADDRESS
  const quote = await getQuote(tokenIn, tokenOut, amountIn, pool.fee)
  if (!quote.success || !quote.amountOut || quote.amountOut <= 0n) {
    return {
      ok: false,
      error: 'The pool cannot fill that size. Try a smaller amount.',
    }
  }

  const quotedOut = quote.amountOut
  const floor = minOut(quotedOut)
  if (floor <= 0n) return { ok: false, error: 'Quote is too small to swap.' }

  const router = UNISWAP_V3_ADDRESSES.SwapRouter02
  const deadline = BigInt(Math.floor(Date.now() / 1000) + 10 * 60)

  if (input.side === 'buy') {
    const data = encodeFunctionData({
      abi: routerAbi,
      functionName: 'exactInputSingle',
      args: [
        {
          tokenIn: WETH_ADDRESS,
          tokenOut: hood,
          fee: pool.fee,
          recipient: input.recipient,
          amountIn,
          amountOutMinimum: floor,
          sqrtPriceLimitX96: 0n,
        },
      ],
    })
    return {
      ok: true,
      plan: {
        side: 'buy',
        fee: pool.fee,
        amountIn,
        quotedOut,
        minOut: floor,
        router,
        value: amountIn,
        data,
        approveAmount: null,
      },
    }
  }

  const swapData = encodeFunctionData({
    abi: routerAbi,
    functionName: 'exactInputSingle',
    args: [
      {
        tokenIn: hood,
        tokenOut: WETH_ADDRESS,
        fee: pool.fee,
        recipient: '0x0000000000000000000000000000000000000000',
        amountIn,
        amountOutMinimum: floor,
        sqrtPriceLimitX96: 0n,
      },
    ],
  })
  const unwrapData = encodeFunctionData({
    abi: routerAbi,
    functionName: 'unwrapWETH9',
    args: [floor, input.recipient],
  })
  const data = encodeFunctionData({
    abi: routerAbi,
    functionName: 'multicall',
    args: [deadline, [swapData, unwrapData]],
  })

  return {
    ok: true,
    plan: {
      side: 'sell',
      fee: pool.fee,
      amountIn,
      quotedOut,
      minOut: floor,
      router,
      value: 0n,
      data,
      approveAmount: amountIn,
    },
  }
}
