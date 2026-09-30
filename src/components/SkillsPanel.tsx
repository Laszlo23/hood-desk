import { SKILLS, skillCount, type SkillCategory, type SkillId } from '../lib/agent/skills'

const LABELS: Record<SkillCategory, string> = {
  wallet: 'Wallet / chain',
  project: 'Project / launchpad',
  market: 'Market / trading',
  social: 'Social / business',
  ops: 'Ops / AI business',
  flavor: 'GM / Hood Street',
  meta: 'Meta',
}

type Props = {
  onInvoke: (skillId: SkillId) => void
  compact?: boolean
}

export function SkillsPanel({ onInvoke, compact }: Props) {
  const byCat = (Object.keys(LABELS) as SkillCategory[]).map((cat) => ({
    cat,
    items: SKILLS.filter((s) => s.category === cat),
  }))

  return (
    <div className={`skills-panel card${compact ? ' compact' : ''}`}>
      <div className="row-between">
        <div>
          <p className="eyebrow">Agent</p>
          <h2 className="section-title">Skills · {skillCount()}</h2>
        </div>
      </div>
      <p className="muted small">Rule-based catalog. Tap to inject into chat.</p>
      <div className="skills-cats">
        {byCat.map(({ cat, items }) =>
          items.length ? (
            <div key={cat} className="skills-cat">
              <p className="rail-label">{LABELS[cat]}</p>
              <div className="chip-row">
                {items.map((s) => (
                  <button
                    key={s.id}
                    type="button"
                    className="skill-chip"
                    title={s.description}
                    onClick={() => onInvoke(s.id)}
                  >
                    {s.id}
                  </button>
                ))}
              </div>
            </div>
          ) : null,
        )}
      </div>
    </div>
  )
}
