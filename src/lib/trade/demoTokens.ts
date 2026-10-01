import { HOOD_TOKEN_ADDRESS } from '../hoodToken'
import { listProjects, type Project } from '../projects'
import type { TradeToken } from './types'

/** Retired stand-in address. No longer listed on Trade. */
export const HOOD_DEMO_ADDRESS = '0xCcFf000000000000000000000000000000004663'

export const DEMO_TOKENS: TradeToken[] = []

function projectToToken(p: Project): TradeToken | null {
  const addr = p.fairLaunch?.tokenAddress
  if (!addr) return null
  if (p.fairLaunch?.status !== 'deployed') return null
  if (addr.toLowerCase().startsWith('0xccff0000')) return null
  const symbol = (p.fairLaunch?.symbol || p.ticker || 'TOKEN').toUpperCase()
  return {
    address: addr,
    name: p.fairLaunch?.name || p.name,
    symbol,
    quote: 'ETH',
    decimals: p.fairLaunch?.decimals ?? 18,
    avatarEmoji: p.avatarEmoji || '🪙',
    price: 0,
    change24h: 0,
    marketCap: 0,
    volume24h: 0,
    badges: ['Robinhood'],
    isDemo: false,
    projectId: p.id,
    socials: p.socials,
    fairLaunchAttached: Boolean(p.fairLaunch),
  }
}

export function defaultTradeToken(): TradeToken {
  return (
    collectTradeTokens()[0] ?? {
      address: HOOD_TOKEN_ADDRESS ?? '0x0000000000000000000000000000000000000000',
      name: 'HOOD',
      symbol: 'HOOD',
      quote: 'ETH',
      decimals: 18,
      avatarEmoji: '🦊',
      price: 0,
      change24h: 0,
      marketCap: 0,
      volume24h: 0,
      badges: ['Robinhood', 'HOOD/WETH'],
      isDemo: false,
      fairLaunchAttached: true,
    }
  )
}

/** Live $HOOD, plus project tokens whose fair launch was deployed on chain. */
export function collectTradeTokens(wallet?: string | null): TradeToken[] {
  const fromProjects = listProjects(wallet)
    .map(projectToToken)
    .filter((t): t is TradeToken => Boolean(t))

  const out: TradeToken[] = []
  const seen = new Set(out.map((t) => t.address.toLowerCase()))

  if (HOOD_TOKEN_ADDRESS && !seen.has(HOOD_TOKEN_ADDRESS.toLowerCase())) {
    out.unshift({
      address: HOOD_TOKEN_ADDRESS,
      name: 'HOOD',
      symbol: 'HOOD',
      quote: 'ETH',
      decimals: 18,
      avatarEmoji: '🦊',
      price: 0,
      change24h: 0,
      marketCap: 0,
      volume24h: 0,
      badges: ['Robinhood', 'HOOD/WETH'],
      isDemo: false,
      fairLaunchAttached: true,
    })
    seen.add(HOOD_TOKEN_ADDRESS.toLowerCase())
  }

  for (const t of fromProjects) {
    if (seen.has(t.address.toLowerCase())) continue
    out.push(t)
    seen.add(t.address.toLowerCase())
  }
  return out
}

export function findToken(
  addressOrSymbol: string,
  wallet?: string | null,
): TradeToken | undefined {
  const q = addressOrSymbol.trim().toLowerCase()
  return collectTradeTokens(wallet).find(
    (t) => t.address.toLowerCase() === q || t.symbol.toLowerCase() === q,
  )
}

export function stubTokenFromAddress(address: string): TradeToken {
  const short = address.slice(2, 6).toUpperCase()
  return {
    address,
    name: `Token ${short}`,
    symbol: short.slice(0, 4) || 'TOK',
    quote: 'ETH',
    decimals: 18,
    avatarEmoji: '❔',
    price: 0,
    change24h: 0,
    marketCap: 0,
    volume24h: 0,
    badges: ['Robinhood'],
    isDemo: false,
  }
}

export function formatUsdCompact(n: number): string {
  if (!n) return '—'
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(2)}M`
  if (n >= 1_000) return `$${(n / 1_000).toFixed(1)}K`
  if (n >= 1) return `$${n.toFixed(2)}`
  return `$${n.toFixed(6)}`
}

export function formatPrice(n: number): string {
  if (n >= 1) return n.toFixed(4)
  if (n >= 0.0001) return n.toFixed(6)
  return n.toExponential(2)
}
