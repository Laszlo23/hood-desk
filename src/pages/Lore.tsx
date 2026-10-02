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
            The forest took from the rich so the pack could eat. Hood Street kept the story. This
            page is the whole of it, and each chapter opens the part of the desk it names.
          </p>
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
