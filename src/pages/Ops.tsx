import type { ViewId } from '../lib/nav'

type Props = { onNavigate: (id: ViewId, projectId?: string) => void }

const LOOP = [
  { icon: '💬', title: 'You ask', body: 'Balance, $HOOD, or a fair-launch note. The desk answers in Ask.' },
  { icon: '🦊', title: 'You sign', body: 'A swap is a Uniswap transaction. The desk never holds the key.' },
  { icon: '🌱', title: 'A seed pairs', body: 'ETH you send is matched with treasury $HOOD. 2% of that ETH goes to the cause.' },
  { icon: '🟢', title: 'The pool stays', body: 'The 1% fee stays in the liquidity position until the position is locked.' },
]

const ROLES = [
  { title: 'Ask', body: 'The desk answers on Robinhood Chain. It does not hold your key.' },
  { title: '$HOOD holders', body: 'The coin is a companion. It is not a share of the desk.' },
  { title: 'The cause', body: '2% of each seed. The pool fee stays in the position.' },
]

export function Ops({ onNavigate }: Props) {
  return (
    <section className="page ops-page">
      <div className="page-intro">
        <p className="eyebrow">How the desk stays up</p>
        <h1>Ops</h1>
        <p className="muted">
          Ask answers. Your wallet signs. A seed adds to the same pool. The fee stays there.
        </p>
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
          Ask
        </button>
        <button type="button" className="btn btn-ghost" onClick={() => onNavigate('rewards')}>
          Ledger
        </button>
        <button type="button" className="btn btn-ghost" onClick={() => onNavigate('revenue')}>
          Revenue
        </button>
      </div>
    </section>
  )
}
