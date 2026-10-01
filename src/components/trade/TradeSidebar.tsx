import { PRIMARY_NAV, STREET_GROUPS, type ViewId } from '../../lib/nav'
import { getSubscription } from '../../lib/subscription'
import { HoodMark } from '../HoodMark'
import { DogiHoodHolderBadge } from '../DogiHoodCard'

type Props = {
  active: ViewId
  onNavigate: (id: ViewId, projectId?: string) => void
}

type NavItem = { id: ViewId; label: string }

export function TradeSidebar({ active, onNavigate }: Props) {
  const sub = getSubscription()

  const renderGroup = (title: string, items: NavItem[]) => (
    <div className="trade-nav-group">
      <p className="trade-nav-label">{title}</p>
      <ul>
        {items.map((item) => {
          const key = `${title}-${item.label}`
          const isActive =
            item.id === 'projects'
              ? active === 'projects' || active === 'project'
              : active === item.id
          return (
            <li key={key}>
              <button
                type="button"
                className={`trade-nav-link${isActive ? ' active' : ''}`}
                onClick={() => onNavigate(item.id)}
              >
                {item.label}
              </button>
            </li>
          )
        })}
      </ul>
    </div>
  )

  return (
    <aside className="trade-sidebar">
      <div className="trade-sidebar-brand">
        <button type="button" className="brand-btn row-gap" onClick={() => onNavigate('landing')}>
          <HoodMark size={52} variant="logo" className="brand-mark-img" alt="Hood Desk" />
          <div>
            <strong className="brand-name">Hood Desk</strong>
            <span className="brand-sub muted block">The bow draws when the wallet signs.</span>
          </div>
        </button>
        <div className="command-desk-pill" aria-label="Desk pulse">
          <span className="status-strip-dot" aria-hidden />
          <span>Desk online · RH 4663</span>
          <button type="button" className="command-desk-link" onClick={() => onNavigate('status')}>
            Status
          </button>
        </div>
      </div>

      {renderGroup('Start', PRIMARY_NAV.map((item) => ({ id: item.id, label: item.label })))}
      {STREET_GROUPS.map((group) =>
        renderGroup(
          group.label,
          group.items.map((item) => ({ id: item.id, label: item.label })),
        ),
      )}

      <div className="trade-sidebar-footer">
        <button type="button" className="btn btn-ghost btn-sm launch-cta" onClick={() => onNavigate('subscribe')}>
          {sub.label === 'Free' ? 'Subscribe' : `Plan: ${sub.label}`}
        </button>
        <div className="sidebar-perk-row">
          <DogiHoodHolderBadge />
        </div>
        <p className="tiny muted">A swap happens when your wallet signs it.</p>
      </div>
    </aside>
  )
}
