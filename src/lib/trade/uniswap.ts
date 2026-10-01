import { createPublicClient, http, type Address } from 'viem'
import { robinhoodChain, RH_RPC } from '../chain'

/**
 * Uniswap V3 official addresses on Robinhood Chain 4663
 * Verified on https://explorer.robinhood.com/
 */
export const UNISWAP_V3_ADDRESSES = {
  UniversalRouter: '0x8876789976decbfcbbbe364623c63652db8c0904',
  UniswapV3Factory: '0x1f7d7550b1b028f7571e69a784071f0205fd2efa',
  QuoterV2: '0x33e885ed0ec9bf04ecfb19341582aadcb4c8a9e7',
  SwapRouter02: '0xcaf681a66d020601342297493863e78c959e5cb2',
  Permit2: '0x000000000022D473030F116dDEE9F6B43aC78BA3',
} as const

export const WETH_ADDRESS: Address = '0x4200000000000000000000000000000000000006'
export const USDG_ADDRESS: Address = '0x46D7C72B0E0E181b1783E5A30c2e0fB15A2F2f5B'

const FEE_TIERS = [100, 500, 3000, 10000] as const

const FACTORY_ABI = [
  {
    type: 'function',
    name: 'getPool',
    stateMutability: 'view',
    inputs: [
      { name: 'tokenA', type: 'address' },
      { name: 'tokenB', type: 'address' },
      { name: 'fee', type: 'uint24' },
    ],
    outputs: [{ name: 'pool', type: 'address' }],
  },
] as const

const QUOTER_ABI = [
  {
    type: 'function',
    name: 'quoteExactInputSingle',
    stateMutability: 'nonpayable',
    inputs: [
      {
        name: 'params',
        type: 'tuple',
        components: [
          { name: 'tokenIn', type: 'address' },
          { name: 'tokenOut', type: 'address' },
          { name: 'amountIn', type: 'uint256' },
          { name: 'fee', type: 'uint24' },
          { name: 'sqrtPriceLimitX96', type: 'uint160' },
        ],
      },
    ],
    outputs: [
      { name: 'amountOut', type: 'uint256' },
      { name: 'sqrtPriceX96After', type: 'uint160' },
      { name: 'initializedTicksCrossed', type: 'uint32' },
      { name: 'gasEstimate', type: 'uint256' },
    ],
  },
] as const

const ZERO_ADDRESS = '0x0000000000000000000000000000000000000000'

let client: ReturnType<typeof createPublicClient> | null = null

function getClient() {
  if (!client) {
    client = createPublicClient({
      chain: robinhoodChain,
      transport: http(RH_RPC),
    })
  }
  return client
}

export type PoolInfo = {
  exists: boolean
  poolAddress: Address | null
  fee: number | null
  tokenA: Address
  tokenB: Address
}

/**
 * Check if a Uniswap V3 pool exists for token pair across all fee tiers.
 * Returns the first pool found (lowest fee tier first).
 */
export async function checkPoolExists(
  tokenA: Address,
  tokenB: Address,
): Promise<PoolInfo> {
  try {
    const c = getClient()
    const factory = UNISWAP_V3_ADDRESSES.UniswapV3Factory

    for (const fee of FEE_TIERS) {
      const pool = await c.readContract({
        address: factory,
        abi: FACTORY_ABI,
        functionName: 'getPool',
        args: [tokenA, tokenB, fee],
      })

      if (pool && pool !== ZERO_ADDRESS) {
        return {
          exists: true,
          poolAddress: pool,
          fee,
          tokenA,
          tokenB,
        }
      }
    }

    return {
      exists: false,
      poolAddress: null,
      fee: null,
      tokenA,
      tokenB,
    }
  } catch (error) {
    console.warn('Failed to check pool existence:', error)
    return {
      exists: false,
      poolAddress: null,
      fee: null,
      tokenA,
      tokenB,
    }
  }
}

export type QuoteResult = {
  success: boolean
  amountOut: bigint | null
  price: number | null
  error?: string
}

/**
 * Get a real quote from Uniswap QuoterV2 for a specific pool.
 * Does NOT execute — read-only quote.
 * Returns null if pool doesn't exist or quote fails.
 */
export async function getQuote(
  tokenIn: Address,
  tokenOut: Address,
  amountIn: bigint,
  fee: number,
): Promise<QuoteResult> {
  try {
    const c = getClient()
    const quoter = UNISWAP_V3_ADDRESSES.QuoterV2

    const result = await c.simulateContract({
      address: quoter,
      abi: QUOTER_ABI,
      functionName: 'quoteExactInputSingle',
      args: [
        {
          tokenIn,
          tokenOut,
          amountIn,
          fee,
          sqrtPriceLimitX96: 0n,
        },
      ],
    })

    const [amountOut] = result.result

    // Calculate price as a simple ratio
    // This is approximate — real price needs decimals adjustment
    const price = Number(amountOut) / Number(amountIn)

    return {
      success: true,
      amountOut,
      price,
    }
  } catch (error) {
    return {
      success: false,
      amountOut: null,
      price: null,
      error: error instanceof Error ? error.message : 'Quote failed',
    }
  }
}

/**
 * Check if $HOOD has any pools vs WETH or USDG.
 * Returns true if at least one pool exists.
 */
export async function hoodHasPool(hoodAddress: Address): Promise<boolean> {
  const wethPool = await checkPoolExists(hoodAddress, WETH_ADDRESS)
  if (wethPool.exists) return true

  const usdgPool = await checkPoolExists(hoodAddress, USDG_ADDRESS)
  return usdgPool.exists
}

/**
 * Get a human-readable price for a token vs WETH or USDG.
 * Returns null if no pool exists.
 */
export async function getTokenPrice(
  tokenAddress: Address,
): Promise<number | null> {
  // Try WETH first (1e18 = 1 WETH)
  const wethPool = await checkPoolExists(tokenAddress, WETH_ADDRESS)
  if (wethPool.exists && wethPool.fee) {
    const quote = await getQuote(
      WETH_ADDRESS,
      tokenAddress,
      10n ** 18n, // 1 WETH
      wethPool.fee,
    )
    if (quote.success && quote.amountOut) {
      // Price = how much token you get for 1 WETH
      // Invert to get token/WETH price
      return 1 / (Number(quote.amountOut) / 1e18)
    }
  }

  // Try USDG (assuming 18 decimals)
  const usdgPool = await checkPoolExists(tokenAddress, USDG_ADDRESS)
  if (usdgPool.exists && usdgPool.fee) {
    const quote = await getQuote(
      USDG_ADDRESS,
      tokenAddress,
      10n ** 18n, // 1 USDG
      usdgPool.fee,
    )
    if (quote.success && quote.amountOut) {
      return 1 / (Number(quote.amountOut) / 1e18)
    }
  }

  return null
}
