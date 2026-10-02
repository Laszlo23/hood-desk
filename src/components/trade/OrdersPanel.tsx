import { HoodSeal } from '../HoodSeal'
import { EXPLORER_TX } from '../../lib/chain'
import type { HoodSwapRow } from '../../lib/trade/poolCandles'
import type { SimulatedOrder } from '../../lib/trade/types'

type Props = {
  orders: SimulatedOrder[]
  poolSwaps: HoodSwapRow[]
  poolState: 'loading' | 'ready' | 'miss'
  tab: 'orders' | 'trades'
  onTab: (t: 'orders' | 'trades') => void
}

function amount(n: number) {
  if (n >= 100) return n.toLocaleString('en-US', { maximumFractionDigits: 0 })
  if (n >= 1) return n.toLocaleString('en-US', { maximumFractionDigits: 2 })
  return n.toLocaleString('en-US', { maximumSignificantDigits: 3 })
}

export function OrdersPanel({ orders, poolSwaps, poolState, tab, onTab }: Props) {
  const rows = tab === 'orders' ? orders : []

  return (
    <div className="orders-panel">
      <div className="orders-tabs">
        <button
          type="button"
          className={`orders-tab${tab === 'orders' ? ' active' : ''}`}
          onClick={() => onTab('orders')}
        >
          Orders
        </button>
        <button
          type="button"
          className={`orders-tab${tab === 'trades' ? ' active' : ''}`}
          onClick={() => onTab('trades')}
        >
          Trades
        </button>
      </div>

      {tab === 'trades' ? (
        <PoolTape swaps={poolSwaps} state={poolState} />
      ) : rows.length === 0 ? (
        <div className="orders-empty">
          <HoodSeal size={40} decorative className="empty-seal" />
          <p className="muted">No orders yet</p>
          <p className="tiny muted">A signed swap from this browser lands here. The pool tape is on Trades.</p>
        </div>
      ) : (
        <div className="orders-table-wrap">
          <table className="orders-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Side</th>
                <th>Type</th>
                <th>Amount</th>
                <th>Status</th>
                <th>Time</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((o) => (
                <tr key={o.id}>
                  <td className="mono tiny" title={o.note}>
                    {o.txHash ? (
                      <a href={EXPLORER_TX(o.txHash)} target="_blank" rel="noreferrer">
                        {o.txHash.slice(0, 10)}…
                      </a>
                    ) : (
                      o.id
                    )}
                  </td>
                  <td className={o.side === 'buy' ? 'side-buy' : 'side-sell'}>
                    {o.side.toUpperCase()}
                  </td>
                  <td>{o.type}</td>
                  <td className="mono">
                    {o.amount} {o.side === 'buy' ? o.quote : o.tokenSymbol}
                  </td>
                  <td>
                    <span className="order-status">{o.status}</span>
                  </td>
                  <td className="tiny muted">
                    {new Date(o.createdAt).toLocaleTimeString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

function PoolTape({ swaps, state }: { swaps: HoodSwapRow[]; state: 'loading' | 'ready' | 'miss' }) {
  if (state === 'loading') {
    return <p className="orders-empty muted">Reading the pool…</p>
  }
  if (state === 'miss' || swaps.length === 0) {
    return (
      <div className="orders-empty">
        <HoodSeal size={40} decorative className="empty-seal" />
        <p className="muted">The pool tape is quiet.</p>
        <p className="tiny muted">Swaps on $HOOD/WETH show here for everyone. A wallet is only needed to sign one.</p>
      </div>
    )
  }
  return (
    <div className="orders-table-wrap">
      <p className="tiny muted orders-tape-note">The pool log. It stays up whether a wallet is connected or not.</p>
      <table className="orders-table">
        <thead>
          <tr>
            <th>Tx</th>
            <th>Side</th>
            <th>HOOD</th>
            <th>ETH</th>
            <th>Time</th>
          </tr>
        </thead>
        <tbody>
          {swaps.slice(0, 24).map((swap) => (
            <tr key={swap.txHash}>
              <td className="mono tiny">
                <a href={EXPLORER_TX(swap.txHash)} target="_blank" rel="noreferrer">
                  {swap.txHash.slice(0, 10)}…
                </a>
              </td>
              <td className={swap.side === 'buy' ? 'side-buy' : 'side-sell'}>{swap.side.toUpperCase()}</td>
              <td className="mono">{amount(swap.hood)}</td>
              <td className="mono">{amount(swap.eth)}</td>
              <td className="tiny muted">{swap.time ? new Date(swap.time * 1000).toLocaleString() : '—'}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
