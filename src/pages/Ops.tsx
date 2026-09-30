import type { ViewId } from '../lib/nav'

type Props = { onNavigate: (id: ViewId, projectId?: string) => void }

const LOOP = [
  { icon: '💬', title: 'Users chat', body: 'Ask Desk for balance, $HOOD, future swap — chips or free text.' },
  { icon: '🦊', title: 'Agent acts on RH', body: 'Rule-based tools on chain 4663. You sign; Desk never holds keys.' },
  { icon: '💸', title: 'Fees → treasury', body: 'DEX fee share fills agent runway (documented; live after DEX).' },
  { icon: '🟢', title: 'Agent stays online', body: 'No humans required for ops. AI business keeps the desk open.' },
]

const ROLES = [
  { title: 'Agent (ops)', body: 'Desk fox — witty, RH-only, action-oriented. Runs tools & stays online.' },
  { title: 'Token holders', body: '$HOOD holders are aligned with desk success — companion coin, not equity.' },
  { title: 'Treasury', body: 'Runway from fees. Funds infra so the agent can keep operating.' },
]

export function Ops({ onNavigate }: Props) {
  return (
    <section className="page ops-page">
      <div className="page-intro">
        <p className="eyebrow">How this AI business runs</p>
        <h1>Ops loop</h1>
        <p className="muted">
          One polished product that proves an AI business can exist — Bankr-style, Hood Street.
        </p>
        <div className="demo-banner">
          <strong>V1 is demo ops.</strong> Live swap after a known RH DEX. No invented routers.
        </div>
      </div>

      <div className="ops-loop" aria-label="Business loop">
        {LOOP.map((step, i) => (
          <div key={step.title} className="ops-step card">
            <span className="ops-num">{i + 1}</span>
            <span className="ops-icon" aria-hidden>
              {step.icon}
            </span>
            <h3>{step.title}</h3>
            <p className="muted">{step.body}</p>
            {i < LOOP.length - 1 && <span className="ops-arrow" aria-hidden>→</span>}
          </div>
        ))}
      </div>

      <h2 className="section-title">Roles</h2>
      <div className="roles-grid">
        {ROLES.map((r) => (
          <article key={r.title} className="card mini-card">
            <h3>{r.title}</h3>
            <p className="muted">{r.body}</p>
          </article>
        ))}
      </div>

      <div className="cta-row mt">
        <button type="button" className="btn btn-primary" onClick={() => onNavigate('terminal')}>
          Open Terminal
        </button>
        <button type="button" className="btn btn-ghost" onClick={() => onNavigate('skills')}>
          Skill Market / Creator desk →
        </button>
        <button type="button" className="btn btn-ghost" onClick={() => onNavigate('rewards')}>
          Rewards
        </button>
        <button type="button" className="btn btn-ghost" onClick={() => onNavigate('blog')}>
          Blog / weekly banner
        </button>
        <button type="button" className="btn btn-ghost" onClick={() => onNavigate('revenue')}>
          Revenue (demo)
        </button>
      </div>
      <p className="tiny muted mt">
        Edit the weekly motivational banner under Blog → Admin. Fee split constants in{' '}
        <code className="inline-code">src/lib/rewards/config.ts</code>.
      </p>
    </section>
  )
}
