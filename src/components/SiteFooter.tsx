import { HoodMark } from './HoodMark'
import { DESK_SOCIALS } from '../lib/socials'
import { hashForView, type ViewId } from '../lib/nav'

type Props = { onNavigate: (id: ViewId) => void }

const DOORS: { id: ViewId; label: string }[] = [
  { id: 'trade', label: 'Trade' },
  { id: 'community', label: 'Pool' },
  { id: 'rewards', label: 'Ledger' },
  { id: 'blog', label: 'Notes' },
  { id: 'lore', label: 'Legend' },
  { id: 'hood', label: '$HOOD' },
]

export function SiteFooter({ onNavigate }: Props) {
  return (
    <footer className="site-footer">
      <div className="site-footer-brand">
        <HoodMark size={44} variant="logo" alt="Hood Desk" />
        <div>
          <strong>Hood Desk</strong>
          <p>From the wood. One coin, one pool, and the notes.</p>
        </div>
      </div>

      <nav className="site-footer-social" aria-label="Social">
        {DESK_SOCIALS.map((item) => (
          <a key={item.id} href={item.href} target="_blank" rel="noreferrer">
            <span>{item.label}</span>
            {item.name}
          </a>
        ))}
      </nav>

      <nav className="site-footer-doors" aria-label="The desk">
        {DOORS.map((door) => (
          <a
            key={door.id}
            href={hashForView(door.id)}
            onClick={(e) => {
              e.preventDefault()
              onNavigate(door.id)
            }}
          >
            {door.label}
          </a>
        ))}
      </nav>

      <p className="site-footer-meta">Robinhood Chain · 4663</p>
    </footer>
  )
}
