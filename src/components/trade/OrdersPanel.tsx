import type { SimulatedOrder } from '../../lib/trade/types'

type Props = {
  orders: SimulatedOrder[]
  tab: 'orders' | 'trades'
  onTab: (t: 'orders' | 'trades') => void
}

export function OrdersPanel({ orders, tab, onTab }: Props) {
  const rows =
    tab === 'trades'
      ? orders.filter((o) => o.status === 'filled')
      : orders

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

      {rows.length === 0 ? (
        <div className="orders-empty">
          <p className="muted">No {tab === 'trades' ? 'trades' : 'orders'} yet</p>
          <p className="tiny muted">Simulate a Market / Limit order in the right panel.</p>
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
                    {o.id}
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
