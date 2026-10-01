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
  /** Called when user clicks simulate; parent may gate via vet modal */
  onRequestSimulate: (draft: TradeDraft) => void
}

const ORDER_TYPES: OrderType[] = ['market', 'limit', 'stop', 'twap', 'dca']

export function TradePanel({
  token,
  lastVet,
  onOpenVet,
  busy = false,
  poolLive = false,
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
  const [mode, setMode] = useState<TradeMode>('pro')
  const [side, setSide] = useState<OrderSide>('buy')
  const [type, setType] = useState<OrderType>('market')
  const [amount, setAmount] = useState('')
  const [limitPrice, setLimitPrice] = useState('')
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
  const effectiveType: OrderType = mode === 'instant' ? 'market' : type
  const needsPrice = effectiveType === 'limit' || effectiveType === 'stop'

  const canSubmit = useMemo(() => {
    if (hasNoPool) return false
    const n = Number(amount)
    if (!amount || !(n > 0)) return false
    if (needsPrice && !(Number(limitPrice) > 0)) return false
    return true
  }, [amount, limitPrice, needsPrice, hasNoPool])

  const liveMarket = poolLive && (mode === 'instant' || type === 'market')

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
    const demoBal = side === 'buy' ? 1.25 : 50_000
    const v = demoBal * pct
    setAmount(side === 'buy' ? v.toFixed(4) : v.toFixed(0))
  }

  const submit = () => {
    if (!canSubmit) return
    onRequestSimulate({
      side,
      type: effectiveType,
      mode,
      amount,
      price: needsPrice ? limitPrice : undefined,
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
            {hasNoPool ? '—' : formatPrice(token.price)}
          </strong>
          {token.isDemo && !hasNoPool && <span className="demo-tag">demo</span>}
          {hasNoPool && <span className="demo-tag">no pool</span>}
        </div>
        <div>
          <span className="rail-label">24h</span>
          <strong className={`mono ${changeCls}`}>
            {hasNoPool ? '—' : `${token.change24h >= 0 ? '+' : ''}${token.change24h.toFixed(1)}%`}
          </strong>
        </div>
        <div>
          <span className="rail-label">MC</span>
          <strong className="mono">
            {hasNoPool ? '—' : formatUsdCompact(token.marketCap)}
          </strong>
        </div>
        <div>
          <span className="rail-label">24h vol</span>
          <strong className="mono">
            {hasNoPool ? '—' : formatUsdCompact(token.volume24h)}
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

      <div className="mode-tabs">
        <button
          type="button"
          className={`mode-tab${mode === 'pro' ? ' active' : ''}`}
          onClick={() => setMode('pro')}
        >
          Pro
        </button>
        <button
          type="button"
          className={`mode-tab${mode === 'instant' ? ' active' : ''}`}
          onClick={() => setMode('instant')}
        >
          Instant
        </button>
      </div>

      {mode === 'pro' && (
        <div className="order-type-row">
          {ORDER_TYPES.map((t) => (
            <button
              key={t}
              type="button"
              className={`ot-chip${type === t ? ' active' : ''}`}
              onClick={() => setType(t)}
            >
              {t.toUpperCase()}
            </button>
          ))}
        </div>
      )}

      {mode === 'instant' && (
        <p className="tiny muted instant-note">
          {poolLive ? 'Instant = market swap on Uniswap. Your wallet signs it.' : 'Instant = market simulate, one tap.'}
        </p>
      )}

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

      {mode === 'pro' && needsPrice && (
        <label className="field">
          <span>{effectiveType === 'stop' ? 'Trigger price' : 'Limit price'}</span>
          <input
            className="input mono"
            inputMode="decimal"
            placeholder={formatPrice(token.price)}
            value={limitPrice}
            onChange={(e) => setLimitPrice(e.target.value)}
          />
        </label>
      )}

      {(effectiveType === 'twap' || effectiveType === 'dca') && mode === 'pro' && (
        <p className="tiny muted">
          {effectiveType.toUpperCase()} schedules are simulated locally only — no on-chain
          execution.
        </p>
      )}

      <button
        type="button"
        className="btn btn-primary trade-submit"
        disabled={!canSubmit || hasNoPool || busy || undefined}
        onClick={submit}
      >
        {busy
          ? 'Waiting for wallet…'
          : hasNoPool
            ? `No pool — cannot trade ${token.symbol}`
            : liveMarket
              ? `${side === 'buy' ? 'Buy' : 'Sell'} ${token.symbol}`
              : `Simulate ${side === 'buy' ? 'Buy' : 'Sell'} ${token.symbol}`}
      </button>

      <p className="tiny muted trade-disclaimer">
        {hasNoPool ? (
          <>
            <strong>${token.symbol} has no Uniswap pool.</strong> Create liquidity on{' '}
            <a href={`https://app.uniswap.org/add/${token.address}`} target="_blank" rel="noreferrer">
              Uniswap
            </a>{' '}
            to enable trading.
          </>
        ) : liveMarket ? (
          <>
            Signs a Uniswap V3 swap on Robinhood Chain. Slippage {HOOD_SWAP_SLIPPAGE_BPS / 100}%. The pool is thin.
          </>
        ) : (
          <>
            This order stays on the desk. $HOOD market swaps are the wallet-signed path.
          </>
        )}
      </p>
    </aside>
  )
}

