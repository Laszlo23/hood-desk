import type { OrderSide, OrderType, QuoteAsset, SimulatedOrder, TradeMode } from './types'

const STORAGE_KEY = 'hood-desk:trade-orders:v1'

function uid(): string {
  return `local_ord_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`
}

export function listOrders(): SimulatedOrder[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw) as unknown
    if (!Array.isArray(parsed)) return []
    return (parsed as SimulatedOrder[]).sort((a, b) =>
      a.createdAt < b.createdAt ? 1 : -1,
    )
  } catch {
    return []
  }
}

function write(orders: SimulatedOrder[]): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(orders.slice(0, 100)))
}

export type PlaceOrderInput = {
  tokenAddress: string
  tokenSymbol: string
  quote: QuoteAsset
  side: OrderSide
  type: OrderType
  mode: TradeMode
  amount: string
  price?: string
}

/** Local simulate only — never invents router / real tx hashes. */
export function placeSimulatedOrder(input: PlaceOrderInput): SimulatedOrder {
  const order: SimulatedOrder = {
    id: uid(),
    createdAt: new Date().toISOString(),
    tokenAddress: input.tokenAddress,
    tokenSymbol: input.tokenSymbol,
    quote: input.quote,
    side: input.side,
    type: input.type,
    mode: input.mode,
    amount: input.amount,
    price: input.price,
    status: input.type === 'market' ? 'filled' : 'simulated',
    note: 'SIMULATED — no on-chain swap. RH DEX router TBD.',
  }
  const all = listOrders()
  all.unshift(order)
  write(all)
  return order
}

export function clearOrders(): void {
  localStorage.removeItem(STORAGE_KEY)
}

export function ordersForToken(tokenAddress: string): SimulatedOrder[] {
  const a = tokenAddress.toLowerCase()
  return listOrders().filter((o) => o.tokenAddress.toLowerCase() === a)
}
