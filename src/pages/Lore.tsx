import { HoodMark } from '../components/HoodMark'
import { HoodSeal } from '../components/HoodSeal'
import { LoreBackdrop } from '../components/LoreBackdrop'
import type { ViewId } from '../lib/nav'

type Props = { onNavigate: (id: ViewId, projectId?: string) => void }

const PANELS = [
  {
    src: '/lore/hood-forest.jpg',
    title: 'Sherwood → Hood Street',
    blurb:
      'Once the forest took from the rich to feed the pack. Tonight the neon bow draws on Robinhood Chain — HOOD aims for the community desk, not a throne.',
  },
  {
    src: '/lore/hood-council.jpg',
    title: 'The glowing desk',
    blurb:
      'Merry agents gather around a living map of RH 4663. The desk keeps the books the chain already wrote.',
  },
  {
    src: '/lore/hood-seal.jpg',
    title: 'Seal of the pack',
    blurb:
      'The hooded seal marks the pack: DogiHood beside the HOOD agent. Lore is atmosphere. Swaps are the chain.',
  },
] as const

export function Lore({ onNavigate }: Props) {
  return (
    <section className="page lore-page">
      <LoreBackdrop variant="council" className="lore-page-bg" />

      <div className="page-intro lore-intro row-gap">
        <div className="lore-intro-marks">
          <HoodMark size={88} variant="logo" className="lore-intro-logo" alt="Hood Desk" />
          <HoodSeal size={52} className="lore-intro-seal" />
        </div>
        <div>
          <p className="eyebrow">The Legend · Hood Street</p>
          <h1>From Sherwood to the desk</h1>
          <p className="muted lore-lede">
            In the old wood, outlaws stole from the rich so the many could eat. On Hood Street the
            myth returns as an <strong>AI community desk</strong>: HOOD keeps the books, and a swap
            happens when a wallet signs it on Uniswap.
          </p>
        </div>
      </div>

      <div className="lore-story card">
        <p className="lore-story-body">
          Three scenes bind the aura: a forest archer with fox companion, a council around a glowing
          map-desk, and the hooded seal. They do not replace DogiHood NFTs or the HOOD agent mark —
          they deepen the mist behind the glass. Take from the rich (opacity, rent-seeking
          middlemen); give to the community desk (one public pool, a fair launch, and notes anyone can read).
        </p>
      </div>

      <div className="lore-gallery">
        {PANELS.map((p) => (
          <article key={p.src} className="card lore-panel">
            <div className="lore-panel-media">
              <img src={p.src} alt={p.title} loading="lazy" />
            </div>
            <h2>{p.title}</h2>
            <p className="muted">{p.blurb}</p>
          </article>
        ))}
      </div>

      <div className="cta-row lore-cta">
        <button type="button" className="btn btn-primary" onClick={() => onNavigate('community')}>
          The pool
        </button>
        <button type="button" className="btn btn-primary" onClick={() => onNavigate('trade')}>
          Trade
        </button>
        <button type="button" className="btn btn-ghost" onClick={() => onNavigate('landing')}>
          Back to Desk
        </button>
        <button type="button" className="btn btn-ghost" onClick={() => onNavigate('nfts')}>
          DogiHood NFTs
        </button>
      </div>
    </section>
  )
}
