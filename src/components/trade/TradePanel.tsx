import { useMemo, useState } from 'react'
import { formatPrice, formatUsdCompact } from '../../lib/trade/demoTokens'
import type {
  OrderSide,
  OrderType,
  TradeMode,
  TradeToken,
  VetResult,
} from '../../lib/trade/types'
import { VerifiedBadge } from '../VerifiedBadge'

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
  /** Called when user clicks simulate; parent may gate via vet modal */
  onRequestSimulate: (draft: TradeDraft) => void
}

const ORDER_TYPES: OrderType[] = ['market', 'limit', 'stop', 'twap', 'dca']

export function TradePanel({ token, lastVet, onOpenVet, onRequestSimulate }: Props) {
  const [mode, setMode] = useState<TradeMode>('pro')
  const [side, setSide] = useState<OrderSide>('buy')
  const [type, setType] = useState<OrderType>('market')
  const [amount, setAmount] = useState('')
  const [limitPrice, setLimitPrice] = useState('')

  const changeCls = token.change24h >= 0 ? 'up' : 'down'
  const effectiveType: OrderType = mode === 'instant' ? 'market' : type
  const needsPrice = effectiveType === 'limit' || effectiveType === 'stop'

  const canSubmit = useMemo(() => {
    const n = Number(amount)
    if (!amount || !(n > 0)) return false
    if (needsPrice && !(Number(limitPrice) > 0)) return false
    return true
  }, [amount, limitPrice, needsPrice])

  const setPct = (pct: number) => {
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
          <strong className="mono">{formatPrice(token.price)}</strong>
          {token.isDemo && <span className="demo-tag">demo</span>}
        </div>
        <div>
          <span className="rail-label">24h</span>
          <strong className={`mono ${changeCls}`}>
            {token.change24h >= 0 ? '+' : ''}
            {token.change24h.toFixed(1)}%
          </strong>
        </div>
        <div>
          <span className="rail-label">MC</span>
          <strong className="mono">{formatUsdCompact(token.marketCap)}</strong>
        </div>
        <div>
          <span className="rail-label">24h vol</span>
          <strong className="mono">{formatUsdCompact(token.volume24h)}</strong>
        </div>
      </div>

      <button type="button" className="btn btn-ghost vet-btn" onClick={onOpenVet}>
        🔍 Is this real? · Vet
      </button>

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
        <p className="tiny muted instant-note">Instant = Market simulate, one tap.</p>
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
        disabled={!canSubmit}
        onClick={submit}
      >
        Simulate {side === 'buy' ? 'Buy' : 'Sell'} {token.symbol}
      </button>

      <p className="tiny muted trade-disclaimer">
        Real on-chain swaps are <strong>TODO</strong> until RH DEX is confirmed. Fills are local (
        <code className="inline-code">local_ord_*</code>) — no fake routers or tx hashes.
      </p>
    </aside>
  )
}

