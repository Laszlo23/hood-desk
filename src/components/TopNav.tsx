import { useEffect, useState } from 'react'
import { hashForView, MORE_NAV, navActive, PRIMARY_NAV, type ViewId } from '../lib/nav'
import { getSubscription } from '../lib/subscription'
import { ConnectButton } from './ConnectButton'
import { HoodMark } from './HoodMark'

type Props = {
  view: ViewId
  onNavigate: (id: ViewId, projectId?: string) => void
}

export function TopNav({ view, onNavigate }: Props) {
  const [open, setOpen] = useState(false)
  const [subLabel, setSubLabel] = useState(() => getSubscription().label)

  useEffect(() => {
    setSubLabel(getSubscription().label)
    setOpen(false)
  }, [view])

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open])

  const go = (id: ViewId) => {
    setOpen(false)
    onNavigate(id)
  }

  return (
    <header className={`top-bar${open ? ' top-bar-open' : ''}`}>
      <div className="top-bar-glow" aria-hidden />
      <div className="top-bar-inner">
        <div className="top-bar-left">
          <button
            type="button"
            className="brand row-gap brand-btn"
            onClick={() => go('landing')}
            aria-label="Hood Desk home"
          >
            <span className="brand-mark-wrap">
              <HoodMark size={30} variant="mark" className="brand-mark-img" />
            </span>
            <span className="brand-wordmark">
              <strong className="brand-name">
                <span className="brand-hood">HOOD</span>
                <span className="brand-desk"> Desk</span>
              </strong>
            </span>
          </button>

          <nav className="top-nav top-nav-desktop" aria-label="Primary">
            {PRIMARY_NAV.map((v) => (
              <a
                key={v.id}
                href={hashForView(v.id)}
                className={`nav-link${navActive(view, v.id) ? ' active' : ''}`}
                onClick={(e) => {
                  e.preventDefault()
                  go(v.id)
                }}
              >
                <span className="nav-link-label">{v.label}</span>
              </a>
            ))}
          </nav>
        </div>

        <div className="top-bar-right">
          <a
            href={hashForView('status')}
            className={`nav-status-pill${view === 'status' ? ' active' : ''}`}
            onClick={(e) => {
              e.preventDefault()
              go('status')
            }}
            title="Desk status"
          >
            <span className="nav-status-dot" aria-hidden />
            Status
          </a>
          <a
            href={hashForView('subscribe')}
            className="nav-cta"
            onClick={(e) => {
              e.preventDefault()
              go('subscribe')
            }}
          >
            <span className="nav-cta-dot" aria-hidden />
            {subLabel === 'Free' ? 'Subscribe' : subLabel}
          </a>
          <div className="nav-connect">
            <ConnectButton />
          </div>
          <button
            type="button"
            className={`nav-burger${open ? ' is-open' : ''}`}
            aria-label={open ? 'Close menu' : 'Open menu'}
            aria-expanded={open}
            onClick={() => setOpen((o) => !o)}
          >
            <span />
            <span />
            <span />
          </button>
        </div>
      </div>

      {open && (
        <div className="top-nav-drawer">
          <div className="top-nav-drawer-sheen" aria-hidden />
          <nav className="top-nav-mobile" aria-label="Mobile primary">
            <p className="top-nav-drawer-label">Navigate</p>
            {PRIMARY_NAV.map((v) => (
              <a
                key={v.id}
                href={hashForView(v.id)}
                className={`nav-link${navActive(view, v.id) ? ' active' : ''}`}
                onClick={(e) => {
                  e.preventDefault()
                  go(v.id)
                }}
              >
                <span className="nav-link-label">{v.label}</span>
                {navActive(view, v.id) && <span className="nav-link-pip" aria-hidden />}
              </a>
            ))}
            <div className="top-nav-drawer-divider" />
            <p className="top-nav-drawer-label">More</p>
            {MORE_NAV.filter((v) => !PRIMARY_NAV.some((p) => p.id === v.id)).map((v) => (
              <a
                key={v.id}
                href={hashForView(v.id)}
                className={`nav-link${navActive(view, v.id) ? ' active' : ''}`}
                onClick={(e) => {
                  e.preventDefault()
                  go(v.id)
                }}
              >
                <span className="nav-link-label">{v.label}</span>
                {navActive(view, v.id) && <span className="nav-link-pip" aria-hidden />}
              </a>
            ))}
            <a
              href={hashForView('subscribe')}
              className="nav-cta nav-cta-drawer"
              onClick={(e) => {
                e.preventDefault()
                go('subscribe')
              }}
            >
              <span className="nav-cta-dot" aria-hidden />
              Subscribe
            </a>
          </nav>
        </div>
      )}
      <div className="top-bar-hairline" aria-hidden />
    </header>
  )
}
