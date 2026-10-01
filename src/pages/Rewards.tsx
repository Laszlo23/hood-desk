import { useEffect, useState } from 'react'
import { EXPLORER_TX } from '../lib/chain'
import { loadHoodLedger, type HoodSwapRow } from '../lib/trade/poolCandles'
import { HOOD_WETH_POOL, uniswapPoolUrl } from '../lib/trade/uniswap'
import type { ViewId } from '../lib/nav'

type Props = { onNavigate: (id: ViewId, projectId?: string) => void }

function formatWhen(unix: number): string {
  if (!unix) return '—'
  return new Date(unix * 1000).toLocaleString()
}

function formatEth(n: number): string {
  if (n >= 0.001) return n.toFixed(4)
  return n.toExponential(2)
}

function formatHood(n: number): string {
  if (n >= 1000) return n.toLocaleString(undefined, { maximumFractionDigits: 0 })
  return n.toLocaleString(undefined, { maximumFractionDigits: 2 })
}

export function Rewards({ onNavigate }: Props) {
  const [rows, setRows] = useState<HoodSwapRow[] | null>(null)
  const [error, setError] = useState(false)

  useEffect(() => {
    let cancelled = false
    loadHoodLedger()
      .then((swaps) => {
        if (!cancelled) setRows(swaps)
      })
      .catch(() => {
        if (!cancelled) setError(true)
      })
    return () => {
      cancelled = true
    }
  }, [])

  const volume = rows?.reduce((sum, row) => sum + row.eth, 0) ?? 0

  return (
    <section className="page rewards-page">
      <div className="page-intro">
        <p className="eyebrow">Pool ledger</p>
        <h1>Ledger</h1>
        <p className="muted">
          Every row is a $HOOD/WETH swap on Uniswap. The 1% fee stays in the liquidity position.
          There is no second payout book. Only swap an amount you can afford to lose. The pool is thin.
        </p>
      </div>
      <article className="card">
        <p className="rail-label">Pool</p>
        <p className="mono tiny">{HOOD_WETH_POOL}</p>
        <p className="muted tiny">
          {rows ? `${rows.length} swaps · ${formatEth(volume)} ETH volume` : error ? 'Pool log did not load.' : 'Reading the pool…'}
        </p>
        <div className="cta-row mt">
          <a className="btn btn-primary btn-sm" href={uniswapPoolUrl()} target="_blank" rel="noreferrer">
            View pool
          </a>
          <button type="button" className="btn btn-ghost btn-sm" onClick={() => onNavigate('trade')}>
            Trade
          </button>
        </div>
        {rows && rows.length > 0 && (
          <div className="orders-table-wrap mt">
            <table className="orders-table ledger">
              <thead>
                <tr>
                  <th>When</th>
                  <th>Side</th>
                  <th>ETH</th>
                  <th>HOOD</th>
                  <th>Tx</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => (
                  <tr key={row.txHash}>
                    <td className="tiny muted">{formatWhen(row.time)}</td>
                    <td className={row.side === 'buy' ? 'side-buy' : 'side-sell'}>{row.side}</td>
                    <td className="mono">{formatEth(row.eth)}</td>
                    <td className="mono">{formatHood(row.hood)}</td>
                    <td>
                      <a href={EXPLORER_TX(row.txHash)} target="_blank" rel="noreferrer">
                        {row.txHash.slice(0, 10)}…
                      </a>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </article>
    </section>
  )
}
