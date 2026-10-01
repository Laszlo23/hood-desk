import { HOOD_TOKEN_ADDRESS } from '../hoodToken'
import { listProjects, type Project } from '../projects'
import type { TradeToken } from './types'

/** Hood-branded demo pair — not musebook/META. Clearly local demo. */
export const HOOD_DEMO_ADDRESS = '0xCcFf000000000000000000000000000000004663'

export const DEMO_TOKENS: TradeToken[] = [
  {
    address: HOOD_DEMO_ADDRESS,
    name: 'Hood Street',
    symbol: 'HOOD',
    quote: 'ETH',
    decimals: 18,
    avatarEmoji: '🦊',
    price: 0.00042,
    change24h: 12.6,
    marketCap: 420_000,
    volume24h: 68_400,
    badges: ['Robinhood', 'Trend', 'Demo'],
    isDemo: true,
    socials: {
      website: 'https://doghood.aibusiness.fun/#/hood',
      farcaster: 'https://warpcast.com/0xleonardo',
      twitter: 'https://x.com/hoodstreet',
    },
    fairLaunchAttached: true,
  },
  {
    address: '0xCcFf00000000000000000000000000000000a11e',
    name: 'Neon Alley',
    symbol: 'NEON',
    quote: 'USDC',
    decimals: 18,
    avatarEmoji: '🟢',
    price: 0.0187,
    change24h: -3.2,
    marketCap: 187_000,
    volume24h: 24_100,
    badges: ['Robinhood', 'Demo'],
    isDemo: true,
    socials: {
      website: 'https://doghood.aibusiness.fun/#/trade',
    },
    fairLaunchAttached: false,
  },
  {
    address: '0xCcFf00000000000000000000000000000000b007',
    name: 'Fox Run',
    symbol: 'FOX',
    quote: 'ETH',
    decimals: 18,
    avatarEmoji: '🏃',
    price: 0.000088,
    change24h: 41.2,
    marketCap: 88_000,
    volume24h: 112_000,
    badges: ['Robinhood', 'Top', 'Demo'],
    isDemo: true,
    fairLaunchAttached: true,
  },
]

function projectToToken(p: Project): TradeToken | null {
  const addr = p.fairLaunch?.tokenAddress
  if (!addr) return null
  const symbol = (p.fairLaunch?.symbol || p.ticker || 'TOKEN').toUpperCase()
  return {
    address: addr,
    name: p.fairLaunch?.name || p.name,
    symbol,
    quote: 'ETH',
    decimals: p.fairLaunch?.decimals ?? 18,
    avatarEmoji: p.avatarEmoji || '🪙',
    price: 0.0001,
    change24h: 0,
    marketCap: 0,
    volume24h: 0,
    badges: ['Robinhood', 'Local project'],
    isDemo: true,
    projectId: p.id,
    socials: p.socials,
    fairLaunchAttached: Boolean(p.fairLaunch),
  }
}

/** Demo list + any project tokens with pasted addresses (+ optional env $HOOD). */
export function collectTradeTokens(wallet?: string | null): TradeToken[] {
  const fromProjects = listProjects(wallet)
    .map(projectToToken)
    .filter((t): t is TradeToken => Boolean(t))

  const out: TradeToken[] = [...DEMO_TOKENS]
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
      badges: ['Robinhood', 'No pool'],
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
    price: 0.00001,
    change24h: 0,
    marketCap: 0,
    volume24h: 0,
    badges: ['Robinhood', 'Pasted', 'Demo'],
    isDemo: true,
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
