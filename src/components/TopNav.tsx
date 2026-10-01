import { useEffect, useRef, useState, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import {
  DRAWER_SECTIONS,
  DRAWER_SECTIONS_STORAGE_KEY,
  drawerSectionHasActive,
  hashForView,
  MORE_NAV,
  moreNavActive,
  navActive,
  PRIMARY_NAV,
  type DrawerSectionId,
  type ViewId,
} from '../lib/nav'
import { getSubscription } from '../lib/subscription'
import { ConnectButton } from './ConnectButton'
import { HoodMark } from './HoodMark'

type Props = {
  view: ViewId
  onNavigate: (id: ViewId, projectId?: string) => void
}

type SectionOpenState = Record<DrawerSectionId, boolean>

function defaultSectionOpen(): SectionOpenState {
  return Object.fromEntries(
    DRAWER_SECTIONS.map((s) => [s.id, s.defaultOpen]),
  ) as SectionOpenState
}

function loadSectionOpen(): SectionOpenState {
  const defaults = defaultSectionOpen()
  try {
    const raw = localStorage.getItem(DRAWER_SECTIONS_STORAGE_KEY)
    if (!raw) return defaults
    const parsed = JSON.parse(raw) as Partial<SectionOpenState>
    return { ...defaults, ...parsed }
  } catch {
    return defaults
  }
}

function persistSectionOpen(next: SectionOpenState) {
  try {
    localStorage.setItem(DRAWER_SECTIONS_STORAGE_KEY, JSON.stringify(next))
  } catch {
    /* ignore quota / private mode */
  }
}

/** Compact stroke icons — no lucide dependency; accent inherits currentColor. */
function NavIcon({ name }: { name: string }) {
  const common = {
    width: 16,
    height: 16,
    viewBox: '0 0 24 24',
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth: 2,
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
    'aria-hidden': true,
    className: 'nav-drawer-icon-svg',
  }
  const paths: Record<string, ReactNode> = {
    trade: (
      <>
        <polyline points="22 7 13.5 15.5 8.5 10.5 2 17" />
        <polyline points="16 7 22 7 22 13" />
      </>
    ),
    autotrade: (
      <>
        <path d="M17 1l4 4-4 4" />
        <path d="M3 11V9a4 4 0 0 1 4-4h14" />
        <path d="M7 23l-4-4 4-4" />
        <path d="M21 13v2a4 4 0 0 1-4 4H3" />
      </>
    ),
    status: (
      <>
        <circle cx="12" cy="12" r="9" />
        <path d="M12 7v5l3 2" />
      </>
    ),
    skills: (
      <>
        <polygon points="12 2 15 9 22 9 17 14 19 21 12 17 5 21 7 14 2 9 9 9" />
      </>
    ),
    terminal: (
      <>
        <polyline points="4 17 10 11 4 5" />
        <line x1="12" y1="19" x2="20" y2="19" />
      </>
    ),
    rewards: (
      <>
        <circle cx="12" cy="8" r="6" />
        <path d="M8.2 13.5 7 22l5-3 5 3-1.2-8.5" />
      </>
    ),
    blog: (
      <>
        <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
        <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
      </>
    ),
    nfts: (
      <>
        <rect x="3" y="3" width="18" height="18" rx="2" />
        <circle cx="9" cy="9" r="2" />
        <path d="m21 15-3.1-3.1a2 2 0 0 0-2.8 0L6 21" />
      </>
    ),
    hood: (
      <>
        <circle cx="12" cy="12" r="9" />
        <path d="M8 12h8" />
        <path d="M12 8v8" />
      </>
    ),
    lore: (
      <>
        <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
        <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
        <path d="M8 7h8" />
        <path d="M8 11h6" />
      </>
    ),
    account: (
      <>
        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
        <circle cx="12" cy="7" r="4" />
      </>
    ),
    projects: (
      <>
        <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
      </>
    ),
    create: (
      <>
        <circle cx="12" cy="12" r="9" />
        <path d="M12 8v8" />
        <path d="M8 12h8" />
      </>
    ),
    ops: (
      <>
        <circle cx="12" cy="12" r="3" />
        <path d="M12 1v2M12 21v2M4.2 4.2l1.4 1.4M18.4 18.4l1.4 1.4M1 12h2M21 12h2M4.2 19.8l1.4-1.4M18.4 5.6l1.4-1.4" />
      </>
    ),
    revenue: (
      <>
        <line x1="12" y1="1" x2="12" y2="23" />
        <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
      </>
    ),
  }
  return <svg {...common}>{paths[name] ?? paths.trade}</svg>
}

function Chevron({ open }: { open: boolean }) {
  return (
    <svg
      className={`nav-drawer-chevron${open ? ' is-open' : ''}`}
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.4"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <polyline points="6 9 12 15 18 9" />
    </svg>
  )
}

export function TopNav({ view, onNavigate }: Props) {
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [moreOpen, setMoreOpen] = useState(false)
  const [sectionOpen, setSectionOpen] = useState<SectionOpenState>(defaultSectionOpen)
  const [subLabel, setSubLabel] = useState(() => getSubscription().label)
  const [navHeight, setNavHeight] = useState(56)
  const moreRef = useRef<HTMLDivElement>(null)
  const barRef = useRef<HTMLElement>(null)

  useEffect(() => {
    setSectionOpen(loadSectionOpen())
  }, [])

  useEffect(() => {
    const el = barRef.current
    if (!el) return
    const measure = () => setNavHeight(Math.ceil(el.getBoundingClientRect().height))
    measure()
    const observer = new ResizeObserver(measure)
    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  useEffect(() => {
    if (!drawerOpen) return
    setSectionOpen((prev) => {
      const next = { ...prev }
      for (const section of DRAWER_SECTIONS) {
        if (drawerSectionHasActive(view, section)) next[section.id] = true
      }
      return next
    })
  }, [drawerOpen, view])

  useEffect(() => {
    setSubLabel(getSubscription().label)
    setDrawerOpen(false)
    setMoreOpen(false)
    // Scroll to top on navigation for mobile
    window.scrollTo(0, 0)
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

  // Lock body scroll when mobile drawer is open
  useEffect(() => {
    if (drawerOpen && window.innerWidth < 1080) {
      document.body.style.overflow = 'hidden'
      return () => {
        document.body.style.overflow = ''
      }
    }
  }, [drawerOpen])

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

  const toggleSection = (id: DrawerSectionId) => {
    setSectionOpen((prev) => {
      const next = { ...prev, [id]: !prev[id] }
      persistSectionOpen(next)
      return next
    })
  }

  const moreIsActive = moreNavActive(view)

  const drawer =
    drawerOpen &&
    createPortal(
      <>
        <div
          className="top-nav-drawer-backdrop"
          onClick={() => setDrawerOpen(false)}
          aria-hidden
        />
        <div
          className="top-nav-drawer"
          role="dialog"
          aria-modal="true"
          aria-label="Menu"
          style={{ top: navHeight, height: `calc(100dvh - ${navHeight}px)` }}
        >
          <div className="top-nav-drawer-sheen" aria-hidden />
          <nav className="top-nav-mobile" aria-label="Mobile primary">
            {DRAWER_SECTIONS.map((section) => {
              const open = sectionOpen[section.id]
              const sectionActive = drawerSectionHasActive(view, section)
              return (
                <div
                  key={section.id}
                  className={`nav-drawer-section${open ? ' is-open' : ''}${sectionActive ? ' has-active' : ''}`}
                >
                  <button
                    type="button"
                    className="nav-drawer-section-header"
                    aria-expanded={open}
                    aria-controls={`drawer-section-${section.id}`}
                    id={`drawer-section-btn-${section.id}`}
                    onClick={() => toggleSection(section.id)}
                  >
                    <span className="nav-drawer-section-title">{section.label}</span>
                    <span className="nav-drawer-section-meta">
                      <span className="nav-drawer-section-count">{section.items.length}</span>
                      <Chevron open={open} />
                    </span>
                  </button>
                  <div
                    id={`drawer-section-${section.id}`}
                    role="region"
                    aria-labelledby={`drawer-section-btn-${section.id}`}
                    className="nav-drawer-section-body"
                    hidden={!open}
                  >
                    {section.items.map((v) => {
                      const active = navActive(view, v.id)
                      return (
                        <a
                          key={v.id}
                          href={hashForView(v.id)}
                          className={`nav-link nav-drawer-link${active ? ' active' : ''}`}
                          onClick={(e) => {
                            e.preventDefault()
                            go(v.id)
                          }}
                        >
                          <span className="nav-drawer-link-main">
                            <span className="nav-drawer-icon">
                              <NavIcon name={v.icon} />
                            </span>
                            <span className="nav-link-label">{v.label}</span>
                          </span>
                          {active && <span className="nav-link-pip" aria-hidden />}
                        </a>
                      )
                    })}
                  </div>
                </div>
              )
            })}
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
      </>,
      document.body,
    )

  return (
    <header ref={barRef} className={`top-bar${drawerOpen ? ' top-bar-open' : ''}`}>
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
            {subLabel === 'Free' ? (
              <>
                <span className="nav-cta-full">Subscribe</span>
                <span className="nav-cta-short">Plans</span>
              </>
            ) : (
              subLabel
            )}
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

      {drawer}
      <div className="top-bar-hairline" aria-hidden />
    </header>
  )
}
