type Props = {
  mode?: string
  tokenSymbol?: string
}

/** Subtle trade desk strip — never claims live DEX fills. */
export function TradeStatusBar({ mode = 'simulate', tokenSymbol }: Props) {
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
      <span className="trade-status-badge">SIMULATED</span>
      {tokenSymbol && (
        <>
          <span className="trade-status-sep" aria-hidden>
            ·
          </span>
          <span className="trade-status-item muted">{tokenSymbol}</span>
        </>
      )}
      <span className="trade-status-hint muted">no live DEX fills</span>
    </div>
  )
}
