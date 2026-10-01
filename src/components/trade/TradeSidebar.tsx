import { useState } from 'react'
import type { ViewId } from '../../lib/nav'
import { getSubscription } from '../../lib/subscription'
import { HoodMark } from '../HoodMark'
import { DogiHoodHolderBadge } from '../DogiHoodCard'
import { XpChip } from '../XpChip'

type Props = {
  active: ViewId
  onNavigate: (id: ViewId, projectId?: string) => void
}

type NavItem = { id: ViewId; label: string }

const AGENT: NavItem[] = [
  { id: 'terminal', label: 'Chat' },
  { id: 'community', label: 'Auto-Trade · HOOD' },
  { id: 'status', label: 'Status' },
  { id: 'account', label: 'Wallet' },
  { id: 'trade', label: 'Trade' },
  { id: 'skills', label: 'Skills / bots' },
]

const EXPLORE: NavItem[] = [
  { id: 'community', label: 'Community desk' },
  { id: 'skills', label: 'Skill Market' },
  { id: 'nfts', label: 'NFTs' },
  { id: 'rewards', label: 'Rewards' },
  { id: 'blog', label: 'Blog' },
  { id: 'projects', label: 'Projects' },
  { id: 'revenue', label: 'Metrics' },
  { id: 'status', label: 'Top / Trending' },
  { id: 'lore', label: 'The Legend' },
]

const BUILD: NavItem[] = [
  { id: 'create', label: 'Your Tokens / Launch' },
  { id: 'hood', label: '$HOOD' },
  { id: 'subscribe', label: 'Subscribe' },
]

export function TradeSidebar({ active, onNavigate }: Props) {
  const [xpTick, setXpTick] = useState(0)
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
          <HoodMark size={36} variant="mark" className="brand-mark-img" />
          <div>
            <strong className="brand-name">Hood Desk</strong>
            <span className="brand-sub muted block">Hood Street</span>
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

      {renderGroup('Agent', AGENT)}
      {renderGroup('Explore', EXPLORE)}
      {renderGroup('Build', BUILD)}

      <div className="trade-sidebar-footer">
        <div className="sidebar-xp-wrap">
          <XpChip
            tick={xpTick}
            onClick={() => {
              setXpTick((t) => t + 1)
              onNavigate('account')
            }}
          />
          <button
            type="button"
            className="btn btn-ghost btn-sm launch-cta"
            onClick={() => onNavigate('account')}
          >
            Wallet / Profile
          </button>
        </div>
        <button type="button" className="btn btn-primary btn-sm launch-cta" onClick={() => onNavigate('create')}>
          Launch a token
        </button>
        <button type="button" className="btn btn-ghost btn-sm launch-cta" onClick={() => onNavigate('subscribe')}>
          {sub.label === 'Free' ? 'Subscribe' : `Plan: ${sub.label}`}
        </button>
        <div className="sidebar-perk-row">
          <DogiHoodHolderBadge />
        </div>
        <p className="tiny muted">
          $HOOD swaps sign on Uniswap. · RH
          4663
        </p>
      </div>
    </aside>
  )
}
