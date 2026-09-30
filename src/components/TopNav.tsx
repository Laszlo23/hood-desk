import { useEffect, useRef, useState } from 'react'
import {
  hashForView,
  MORE_NAV,
  moreNavActive,
  navActive,
  PRIMARY_NAV,
  type ViewId,
} from '../lib/nav'
import { getSubscription } from '../lib/subscription'
import { ConnectButton } from './ConnectButton'
import { HoodMark } from './HoodMark'

type Props = {
  view: ViewId
  onNavigate: (id: ViewId, projectId?: string) => void
}

export function TopNav({ view, onNavigate }: Props) {
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [moreOpen, setMoreOpen] = useState(false)
  const [subLabel, setSubLabel] = useState(() => getSubscription().label)
  const moreRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    setSubLabel(getSubscription().label)
    setDrawerOpen(false)
    setMoreOpen(false)
  }, [view])

  useEffect(() => {
    if (!drawerOpen && !moreOpen) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setDrawerOpen(false)
        setMoreOpen(false)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [drawerOpen, moreOpen])

  useEffect(() => {
    if (!moreOpen) return
    const onPointer = (e: MouseEvent) => {
      if (moreRef.current && !moreRef.current.contains(e.target as Node)) {
        setMoreOpen(false)
      }
    }
    document.addEventListener('mousedown', onPointer)
    return () => document.removeEventListener('mousedown', onPointer)
  }, [moreOpen])

  const go = (id: ViewId) => {
    setDrawerOpen(false)
    setMoreOpen(false)
    onNavigate(id)
  }

  const moreIsActive = moreNavActive(view)

  return (
    <header className={`top-bar${drawerOpen ? ' top-bar-open' : ''}`}>
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

            <div className="nav-more" ref={moreRef}>
              <button
                type="button"
                className={`nav-link nav-more-trigger${moreIsActive ? ' active' : ''}${moreOpen ? ' is-open' : ''}`}
                aria-expanded={moreOpen}
                aria-haspopup="menu"
                onClick={() => setMoreOpen((o) => !o)}
              >
                <span className="nav-link-label">More</span>
                <span className="nav-more-caret" aria-hidden />
              </button>
              {moreOpen && (
                <div className="nav-more-menu" role="menu" aria-label="More pages">
                  {MORE_NAV.map((v) => (
                    <a
                      key={v.id}
                      role="menuitem"
                      href={hashForView(v.id)}
                      className={`nav-more-item${navActive(view, v.id) ? ' active' : ''}`}
                      onClick={(e) => {
                        e.preventDefault()
                        go(v.id)
                      }}
                    >
                      <span>{v.label}</span>
                      {navActive(view, v.id) && <span className="nav-link-pip" aria-hidden />}
                    </a>
                  ))}
                </div>
              )}
            </div>
          </nav>
        </div>

        <div className="top-bar-right">
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
            className={`nav-burger${drawerOpen ? ' is-open' : ''}`}
            aria-label={drawerOpen ? 'Close menu' : 'Open menu'}
            aria-expanded={drawerOpen}
            onClick={() => {
              setMoreOpen(false)
              setDrawerOpen((o) => !o)
            }}
          >
            <span />
            <span />
            <span />
          </button>
        </div>
      </div>

      {drawerOpen && (
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
            {MORE_NAV.map((v) => (
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
