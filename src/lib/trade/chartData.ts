import type { Candle, Timeframe } from './types'

const TF_SECONDS: Record<Timeframe, number> = {
  '1m': 60,
  '5m': 300,
  '15m': 900,
  '1h': 3600,
  '4h': 14400,
  '1D': 86400,
}

const TF_COUNT: Record<Timeframe, number> = {
  '1m': 120,
  '5m': 96,
  '15m': 96,
  '1h': 72,
  '4h': 60,
  '1D': 90,
}

/** Deterministic PRNG from seed string */
function hashSeed(s: string): number {
  let h = 2166136261
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i)
    h = Math.imul(h, 16777619)
  }
  return h >>> 0
}

function mulberry32(a: number) {
  return () => {
    let t = (a += 0x6d2b79f5)
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

/** Seeded demo OHLCV — labeled demo; not a live RH DEX feed. */
export function generateDemoCandles(
  seedKey: string,
  timeframe: Timeframe,
  basePrice: number,
): Candle[] {
  const step = TF_SECONDS[timeframe]
  const count = TF_COUNT[timeframe]
  const rand = mulberry32(hashSeed(`${seedKey}:${timeframe}:${Math.floor(basePrice * 1e8)}`))
  const now = Math.floor(Date.now() / 1000)
  const aligned = now - (now % step)
  let price = Math.max(basePrice * 0.7, basePrice * (0.85 + rand() * 0.2))
  const candles: Candle[] = []

  for (let i = count - 1; i >= 0; i--) {
    const time = aligned - i * step
    const drift = (rand() - 0.48) * basePrice * 0.04
    const open = price
    const close = Math.max(basePrice * 0.05, open + drift)
    const wick = basePrice * (0.005 + rand() * 0.02)
    const high = Math.max(open, close) + wick * rand()
    const low = Math.min(open, close) - wick * rand()
    const volume = basePrice * (500 + rand() * 4500) * (timeframe === '1D' ? 8 : 1)
    candles.push({
      time,
      open: +open.toPrecision(8),
      high: +high.toPrecision(8),
      low: +Math.max(low, 0).toPrecision(8),
      close: +close.toPrecision(8),
      volume: +volume.toFixed(2),
    })
    price = close
  }
  return candles
}
