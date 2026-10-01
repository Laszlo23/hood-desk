type Props = {
  mode?: string
  tokenSymbol?: string
  live?: boolean
}

/** Trade desk strip. Live means $HOOD market swaps sign on Uniswap. */
export function TradeStatusBar({ mode = 'no pool', tokenSymbol, live = false }: Props) {
  return (
    <div className="trade-status-bar" aria-label="Trade desk status">
      <span className="trade-status-item">
        <span className="trade-status-dot" aria-hidden />
        Desk online
      </span>
      <span className="trade-status-sep" aria-hidden>
        ·
      </span>
      <span className="trade-status-item">
        Mode <strong>{mode}</strong>
      </span>
      <span className="trade-status-sep" aria-hidden>
        ·
      </span>
      <span className="trade-status-item">
        Chain <strong>RH 4663</strong>
      </span>
      <span className="trade-status-sep" aria-hidden>
        ·
      </span>
      <span className="trade-status-badge">{live ? 'UNISWAP' : 'NO POOL'}</span>
      {tokenSymbol && (
        <>
          <span className="trade-status-sep" aria-hidden>
            ·
          </span>
          <span className="trade-status-item muted">{tokenSymbol}</span>
        </>
      )}
      <span className="trade-status-hint muted">
        {live ? 'only risk what you can lose' : 'no swap until a pool exists'}
      </span>
    </div>
  )
}
