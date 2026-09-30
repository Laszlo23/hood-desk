/** Trade UI types — local/simulated only until RH DEX is confirmed. */

export type QuoteAsset = 'ETH' | 'USDC'

export type Timeframe = '1m' | '5m' | '15m' | '1h' | '4h' | '1D'

export type TradeMode = 'pro' | 'instant'

export type OrderType = 'market' | 'limit' | 'stop' | 'twap' | 'dca'

export type OrderSide = 'buy' | 'sell'

export type OrderStatus = 'simulated' | 'filled' | 'cancelled'

export type Candle = {
  time: number // unix seconds
  open: number
  high: number
  low: number
  close: number
  volume: number
}

export type TradeToken = {
  address: string
  name: string
  symbol: string
  quote: QuoteAsset
  decimals: number
  avatarEmoji: string
  /** Demo market stats — labeled as demo in UI */
  price: number
  change24h: number
  marketCap: number
  volume24h: number
  badges: string[]
  isDemo: boolean
  projectId?: string
  socials?: {
    website?: string
    twitter?: string
    farcaster?: string
    discord?: string
    telegram?: string
  }
  fairLaunchAttached?: boolean
}

export type SimulatedOrder = {
  id: string
  createdAt: string
  tokenAddress: string
  tokenSymbol: string
  quote: QuoteAsset
  side: OrderSide
  type: OrderType
  mode: TradeMode
  amount: string
  price?: string
  status: OrderStatus
  note: string
}

export type VetVerdict = 'Likely real' | 'Caution' | 'High risk'

export type VetResult = {
  score: number
  verdict: VetVerdict
  reasons: string[]
  address: string
  checkedAt: string
}
