import { useEffect, useMemo, useState } from 'react'
import { useAccount, useBalance, useReadContract } from 'wagmi'
import { formatUnits } from 'viem'
import { formatPrice, formatUsdCompact } from '../../lib/trade/demoTokens'
import { erc20Abi, HOOD_TOKEN_ADDRESS } from '../../lib/hoodToken'
import { HOOD_SWAP_SLIPPAGE_BPS } from '../../lib/trade/hoodSwap'
import type {
  OrderSide,
  OrderType,
  TradeMode,
  TradeToken,
  VetResult,
} from '../../lib/trade/types'
import { VerifiedBadge } from '../VerifiedBadge'
import type { HoodPoolChart } from '../../lib/trade/poolCandles'
import { hoodHasPool } from '../../lib/trade/uniswap'

export type TradeDraft = {
  side: OrderSide
  type: OrderType
  mode: TradeMode
  amount: string
  price?: string
}

type Props = {
  token: TradeToken
  lastVet: VetResult | null
  onOpenVet: () => void
  busy?: boolean
  /** $HOOD market orders sign on Uniswap when this is true. */
  poolLive?: boolean
  /** Live pool price. Omit for demo pairs. */
  liveQuote?: HoodPoolChart | null
  /** Called when user clicks simulate; parent may gate via vet modal */
  onRequestSimulate: (draft: TradeDraft) => void
}

export function TradePanel({
  token,
  lastVet,
  onOpenVet,
  busy = false,
  poolLive = false,
  liveQuote = null,
  onRequestSimulate,
}: Props) {
  const { address } = useAccount()
  const { data: ethBal } = useBalance({
    address,
    query: { enabled: Boolean(address && poolLive) },
  })
  const { data: hoodBal } = useReadContract({
    address: HOOD_TOKEN_ADDRESS ?? undefined,
    abi: erc20Abi,
    functionName: 'balanceOf',
    args: address ? [address] : undefined,
    query: { enabled: Boolean(address && poolLive && HOOD_TOKEN_ADDRESS) },
  })
  const [side, setSide] = useState<OrderSide>('buy')
  const [amount, setAmount] = useState('')
  const [poolExists, setPoolExists] = useState<boolean | null>(null)

  const isHoodToken = HOOD_TOKEN_ADDRESS && 
    token.address.toLowerCase() === HOOD_TOKEN_ADDRESS.toLowerCase()

  // Check if $HOOD has a pool
  useEffect(() => {
    if (!isHoodToken || !HOOD_TOKEN_ADDRESS) {
      setPoolExists(null)
      return
    }

    let cancelled = false

    hoodHasPool(HOOD_TOKEN_ADDRESS)
      .then((exists) => {
        if (!cancelled) {
          setPoolExists(exists)
        }
      })
      .catch(() => {
        if (!cancelled) {
          setPoolExists(false)
        }
      })

    return () => {
      cancelled = true
    }
  }, [isHoodToken])

  const hasNoPool = isHoodToken && poolExists === false

  const changeCls = token.change24h >= 0 ? 'up' : 'down'

  const canSubmit = useMemo(() => {
    if (!poolLive || hasNoPool) return false
    const n = Number(amount)
    return Boolean(amount) && n > 0
  }, [amount, hasNoPool, poolLive])

  const setPct = (pct: number) => {
    if (poolLive && address) {
      const bal = side === 'buy' ? ethBal?.value : hoodBal
      if (bal && bal > 0n) {
        const bps = BigInt(Math.round(pct * 10_000))
        let amt = (bal * bps) / 10_000n
        const gasReserve = 50_000_000_000_000n
        if (side === 'buy' && pct === 1 && bal > gasReserve) amt = bal - gasReserve
        setAmount(formatUnits(amt, 18))
        return
      }
    }
  }

  const submit = () => {
    if (!canSubmit) return
    onRequestSimulate({
      side,
      type: 'market',
      mode: 'instant',
      amount,
    })
  }

  return (
    <aside className="trade-right-panel">
      <div className="token-header">
        <span className="token-avatar lg">{token.avatarEmoji}</span>
        <div className="token-header-text">
          <strong className="token-name-row">
            {token.symbol}
            <VerifiedBadge address={token.address} />
            <span className="muted tiny"> · {token.name}</span>
          </strong>
          <span className="muted mono tiny truncate" title={token.address}>
            {token.address.slice(0, 6)}…{token.address.slice(-4)}
          </span>
        </div>
      </div>

      <div className="badge-row">
        {token.badges.map((b) => (
          <span key={b} className="trade-badge">
            {b === 'Robinhood' ? '✓ Robinhood' : b}
          </span>
        ))}
      </div>

      <div className="token-stats">
        <div>
          <span className="rail-label">Price</span>
          <strong className="mono">
            {hasNoPool ? '—' : formatPrice(liveQuote ? liveQuote.price : token.price)}
          </strong>
          {liveQuote && <span className="demo-tag">pool</span>}
          {hasNoPool && <span className="demo-tag">no pool</span>}
        </div>
        <div>
          <span className="rail-label">24h</span>
          <strong className={`mono ${liveQuote ? (liveQuote.changePct >= 0 ? 'up' : 'down') : changeCls}`}>
            {hasNoPool
              ? '—'
              : liveQuote
                ? `${liveQuote.changePct >= 0 ? '+' : ''}${liveQuote.changePct.toFixed(1)}%`
                : `${token.change24h >= 0 ? '+' : ''}${token.change24h.toFixed(1)}%`}
          </strong>
        </div>
        <div>
          <span className="rail-label">MC</span>
          <strong className="mono">
            {hasNoPool || liveQuote ? '—' : formatUsdCompact(token.marketCap)}
          </strong>
        </div>
        <div>
          <span className="rail-label">Vol</span>
          <strong className="mono">
            {hasNoPool
              ? '—'
              : liveQuote
                ? `${liveQuote.volumeEth.toFixed(6)} ETH`
                : formatUsdCompact(token.volume24h)}
          </strong>
        </div>
      </div>

      {hasNoPool && (
        <div className="trade-pool-warning">
          <strong>⚠️ No Uniswap pool</strong>
          <p className="tiny muted">
            ${token.symbol} has no liquidity pool on Uniswap V3. Trading is not possible until a pool is created.
          </p>
        </div>
      )}

      {!hasNoPool && (
        <button type="button" className="btn btn-ghost vet-btn" onClick={onOpenVet}>
          🔍 Is this real? · Vet
        </button>
      )}

      {lastVet && lastVet.address.toLowerCase() === token.address.toLowerCase() && (
        <p className={`vet-chip verdict-${lastVet.verdict.replace(/\s+/g, '-').toLowerCase()}`}>
          Last vet: <strong>{lastVet.verdict}</strong> · {lastVet.score}/100
        </p>
      )}

      <p className="tiny muted instant-note">Market swap on Uniswap. Your wallet signs it.</p>

      <div className="side-tabs">
        <button
          type="button"
          className={`side-tab sell${side === 'sell' ? ' active' : ''}`}
          onClick={() => setSide('sell')}
        >
          Sell
        </button>
        <button
          type="button"
          className={`side-tab buy${side === 'buy' ? ' active' : ''}`}
          onClick={() => setSide('buy')}
        >
          Buy
        </button>
      </div>

      <label className="field">
        <span>{side === 'buy' ? `Pay (${token.quote})` : `Sell (${token.symbol})`}</span>
        <input
          className="input mono"
          inputMode="decimal"
          placeholder="0.0"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
        />
      </label>

      <div className="pct-row">
        {[0.25, 0.5, 1].map((pct) => (
          <button key={pct} type="button" className="pct-chip" onClick={() => setPct(pct)}>
            {pct === 1 ? 'Max' : `${pct * 100}%`}
          </button>
        ))}
      </div>

      <button
        type="button"
        className="btn btn-primary trade-submit"
        disabled={!canSubmit || busy || undefined}
        onClick={submit}
      >
        {busy
          ? 'Waiting for wallet…'
          : poolLive
            ? `${side === 'buy' ? 'Buy' : 'Sell'} ${token.symbol}`
            : `No pool — cannot trade ${token.symbol}`}
      </button>

      <p className="tiny muted trade-disclaimer">
        {poolLive ? (
          <>
            Only swap an amount you can afford to lose. Your wallet signs a Uniswap swap. Slippage {HOOD_SWAP_SLIPPAGE_BPS / 100}%. The pool is thin. A large amount belongs on the $HOOD seed rail: 2% goes to causes, and the rest is paired with treasury $HOOD at the pool price.
          </>
        ) : (
          <>
            <strong>${token.symbol} has no Uniswap pool on Robinhood Chain.</strong> There is no local fill.
          </>
        )}
      </p>
    </aside>
  )
}

