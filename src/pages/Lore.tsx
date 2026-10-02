import { HoodMark } from '../components/HoodMark'
import { HoodSeal } from '../components/HoodSeal'
import { LoreBackdrop } from '../components/LoreBackdrop'
import { StoryWalk } from '../components/StoryWalk'
import type { ViewId } from '../lib/nav'

type Props = { onNavigate: (id: ViewId, projectId?: string) => void }

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
          <p className="eyebrow">The legend · Hood Street</p>
          <h1>From the wood to the desk</h1>
          <p className="muted lore-lede">
            This page is the story. The app is the coin, the pool, and the ledger. Stay dark is a
            small game, for fun. The thank-you is the lore in one piece. Each chapter still opens
            the page it names.
          </p>
          <button type="button" className="btn btn-primary btn-sm mt" onClick={() => onNavigate('blog', 'thank-you-this-is-the-lore')}>
            Read the thank you
          </button>
        </div>
      </div>

      <StoryWalk mode="page" onNavigate={onNavigate} />

      <div className="cta-row lore-cta">
        <button type="button" className="btn btn-primary" onClick={() => onNavigate('trade')}>
          Trade $HOOD
        </button>
        <button type="button" className="btn btn-quiet" onClick={() => onNavigate('landing')}>
          Back to the desk
        </button>
      </div>
    </section>
  )
}
