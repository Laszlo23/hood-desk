import { createPublicClient, http, parseAbiItem } from 'viem'
import { robinhoodChain, RH_RPC } from '../chain'
import { HOOD_WETH_POOL } from './uniswap'
import type { Candle, Timeframe } from './types'

/** Pool create block on Robinhood Chain. Logs before this are unrelated. */
const POOL_FROM_BLOCK = 77502606n

const TF_SECONDS: Record<Timeframe, number> = {
  '1m': 60,
  '5m': 300,
  '15m': 900,
  '1h': 3600,
  '4h': 14400,
  '1D': 86400,
}

const Q96 = 2 ** 96

const INIT_EVENT = parseAbiItem('event Initialize(uint160 sqrtPriceX96, int24 tick)')
const SWAP_EVENT = parseAbiItem(
  'event Swap(address indexed sender, address indexed recipient, int256 amount0, int256 amount1, uint160 sqrtPriceX96, uint128 liquidity, int24 tick)',
)

const SLOT0_ABI = [
  {
    type: 'function',
    name: 'slot0',
    stateMutability: 'view',
    inputs: [],
    outputs: [
      { name: 'sqrtPriceX96', type: 'uint160' },
      { name: 'tick', type: 'int24' },
      { name: 'observationIndex', type: 'uint16' },
      { name: 'observationCardinality', type: 'uint16' },
      { name: 'observationCardinalityNext', type: 'uint16' },
      { name: 'feeProtocol', type: 'uint8' },
      { name: 'unlocked', type: 'bool' },
    ],
  },
] as const

type Point = { time: number; price: number; volumeEth: number }

export type HoodSwapRow = {
  txHash: string
  time: number
  /** Buy means ETH went into the pool. Sell means HOOD went into the pool. */
  side: 'buy' | 'sell'
  eth: number
  hood: number
  price: number
}

export type HoodPoolChart = {
  candles: Candle[]
  /** ETH per 1 HOOD, from the pool price. */
  price: number
  changePct: number
  volumeEth: number
  swapCount: number
}

/** token0 is WETH, token1 is HOOD, so ETH per HOOD is the inverse of the raw price. */
export function ethPerHoodFromSqrt(sqrtPriceX96: bigint): number {
  const ratio = Number(sqrtPriceX96) / Q96
  const hoodPerEth = ratio * ratio
  if (!Number.isFinite(hoodPerEth) || hoodPerEth === 0) return 0
  return 1 / hoodPerEth
}

let pointsCache: { at: number; points: Point[]; swapCount: number; swaps: HoodSwapRow[] } | null = null

async function loadPoints(): Promise<{ points: Point[]; swapCount: number; swaps: HoodSwapRow[] }> {
  if (pointsCache && Date.now() - pointsCache.at < 20_000) return pointsCache

  const client = createPublicClient({
    chain: robinhoodChain,
    transport: http(RH_RPC),
  })

  const [initLogs, swapLogs, slot0] = await Promise.all([
    client.getLogs({
      address: HOOD_WETH_POOL,
      event: INIT_EVENT,
      fromBlock: POOL_FROM_BLOCK,
      toBlock: POOL_FROM_BLOCK,
    }),
    client.getLogs({
      address: HOOD_WETH_POOL,
      event: SWAP_EVENT,
      fromBlock: POOL_FROM_BLOCK,
      toBlock: 'latest',
    }),
    client.readContract({
      address: HOOD_WETH_POOL,
      abi: SLOT0_ABI,
      functionName: 'slot0',
    }),
  ])

  const blockNums = new Set<bigint>()
  for (const log of initLogs) blockNums.add(log.blockNumber)
  for (const log of swapLogs) blockNums.add(log.blockNumber)

  const times = new Map<string, number>()
  await Promise.all(
    [...blockNums].map(async (blockNumber) => {
      const block = await client.getBlock({ blockNumber })
      times.set(blockNumber.toString(), Number(block.timestamp))
    }),
  )

  const points: Point[] = []
  for (const log of initLogs) {
    if (log.args.sqrtPriceX96 === undefined) continue
    points.push({
      time: times.get(log.blockNumber.toString()) ?? 0,
      price: ethPerHoodFromSqrt(log.args.sqrtPriceX96),
      volumeEth: 0,
    })
  }
  const swaps: HoodSwapRow[] = []
  for (const log of swapLogs) {
    if (
      log.args.sqrtPriceX96 === undefined ||
      log.args.amount0 === undefined ||
      log.args.amount1 === undefined
    ) {
      continue
    }
    const eth = Math.abs(Number(log.args.amount0)) / 1e18
    const hood = Math.abs(Number(log.args.amount1)) / 1e18
    const price = ethPerHoodFromSqrt(log.args.sqrtPriceX96)
    points.push({
      time: times.get(log.blockNumber.toString()) ?? 0,
      price,
      volumeEth: eth,
    })
    swaps.push({
      txHash: log.transactionHash,
      time: times.get(log.blockNumber.toString()) ?? 0,
      side: log.args.amount0 > 0n ? 'buy' : 'sell',
      eth,
      hood,
      price,
    })
  }
  swaps.sort((a, b) => b.time - a.time)
  points.sort((a, b) => a.time - b.time)

  const live = ethPerHoodFromSqrt(slot0[0])
  const last = points[points.length - 1]
  if (live > 0 && (!last || Math.abs(last.price - live) / live > 1e-9)) {
    const head = await client.getBlock({ blockTag: 'latest' })
    points.push({ time: Number(head.timestamp), price: live, volumeEth: 0 })
  }

  const cached = { at: Date.now(), points, swapCount: swapLogs.length, swaps }
  pointsCache = cached
  return cached
}

export async function loadHoodLedger(): Promise<HoodSwapRow[]> {
  const { swaps } = await loadPoints()
  return swaps
}

/** Pool prints in time order, including the live price when it has moved. */
export async function loadHoodPricePath(): Promise<{ time: number; price: number }[]> {
  const { points } = await loadPoints()
  return points
    .filter((point) => point.price > 0 && point.time > 0)
    .map((point) => ({ time: point.time, price: point.price }))
}

export function candlesFromPoints(points: Point[], timeframe: Timeframe): Candle[] {
  if (points.length === 0) return []
  const step = TF_SECONDS[timeframe]
  const buckets = new Map<number, Candle>()
  let prev = points[0].price

  for (const point of points) {
    const time = point.time - (point.time % step)
    const existing = buckets.get(time)
    if (!existing) {
      buckets.set(time, {
        time,
        open: prev,
        high: Math.max(prev, point.price),
        low: Math.min(prev, point.price),
        close: point.price,
        volume: point.volumeEth,
      })
    } else {
      existing.high = Math.max(existing.high, point.price)
      existing.low = Math.min(existing.low, point.price)
      existing.close = point.price
      existing.volume += point.volumeEth
    }
    prev = point.price
  }

  return [...buckets.values()].sort((a, b) => a.time - b.time)
}

export async function loadHoodPoolChart(timeframe: Timeframe): Promise<HoodPoolChart> {
  const { points, swapCount } = await loadPoints()
  const candles = candlesFromPoints(points, timeframe)
  const first = points[0]?.price ?? 0
  const last = points[points.length - 1]?.price ?? 0
  const changePct = first > 0 ? ((last - first) / first) * 100 : 0
  const volumeEth = points.reduce((sum, point) => sum + point.volumeEth, 0)
  return { candles, price: last, changePct, volumeEth, swapCount }
}
