import { useMemo, useState } from 'react'
import { useAccount } from 'wagmi'
import { listProjects, socialChips, storageOwnerKey } from '../lib/projects'
import { VerifiedBadge } from '../components/VerifiedBadge'
import { HoodSeal } from '../components/HoodSeal'
import type { ViewId } from '../lib/nav'

type Props = {
  onNavigate: (id: ViewId, projectId?: string) => void
}

export function Projects({ onNavigate }: Props) {
  const { address } = useAccount()
  const [tick, setTick] = useState(0)
  const projects = useMemo(() => {
    void tick
    return listProjects(address)
  }, [address, tick])

  return (
    <section className="page projects-page">
      <div className="page-intro row-between">
        <div>
          <p className="eyebrow">Your AI businesses</p>
          <h1>Projects</h1>
          <p className="muted">
            Keyed by <code className="inline-code">{storageOwnerKey(address)}</code> in localStorage.
            Refresh-safe. Every token path is <strong>Fair launch</strong> only.
          </p>
        </div>
        <button type="button" className="btn btn-primary" onClick={() => onNavigate('create')}>
          + Create
        </button>
      </div>

      {projects.length === 0 ? (
        <div className="card empty-card">
          <HoodSeal size={56} decorative className="empty-seal" />
          <p className="eyebrow">Empty desk</p>
          <h2>No projects yet</h2>
          <p className="muted">
            Create a local AI-business card (name, ticker, socials, persona). Fair-launch wizard is
            demo until you paste a real RH token address — no invented routers.
          </p>
          <div className="cta-row mt">
            <button type="button" className="btn btn-primary" onClick={() => onNavigate('create')}>
              Create project
            </button>
            <button type="button" className="btn btn-ghost" onClick={() => onNavigate('blog')}>
              Read Hood Street posts
            </button>
            <button type="button" className="btn btn-ghost" onClick={() => onNavigate('trade')}>
              Try demo Trade
            </button>
          </div>
        </div>
      ) : (
        <div className="projects-grid">
          {projects.map((p) => {
            const chips = socialChips(p.socials)
            return (
              <article key={p.id} className="card project-card">
                <div className="row-between">
                  <div className="row-gap">
                    {p.logoUrl ? (
                      <img src={p.logoUrl} alt="" className="project-logo" />
                    ) : (
                      <span className="project-emoji" aria-hidden>
                        {p.avatarEmoji || '🦊'}
                      </span>
                    )}
                    <div>
                      <h3>
                        {p.name}
                        {p.ticker ? (
                          <span className="ticker-tag">
                            {' '}
                            ${p.ticker}
                            {p.fairLaunch?.tokenAddress ? (
                              <VerifiedBadge address={p.fairLaunch.tokenAddress} />
                            ) : null}
                          </span>
                        ) : null}
                      </h3>
                      <p className="muted small">{p.description || 'No description'}</p>
                    </div>
                  </div>
                  {p.fairLaunch ? (
                    <span className="badge">Fair launch · {p.fairLaunch.status}</span>
                  ) : (
                    <span className="badge badge-muted">No token yet</span>
                  )}
                </div>
                {chips.length > 0 && (
                  <div className="chip-row mt">
                    {chips.map((c) => (
                      <a key={c.label} className="social-chip" href={c.href} target="_blank" rel="noreferrer">
                        {c.label}
                      </a>
                    ))}
                  </div>
                )}
                <div className="cta-row">
                  <button
                    type="button"
                    className="btn btn-sm btn-primary"
                    onClick={() => onNavigate('project', p.id)}
                  >
                    Open →
                  </button>
                </div>
              </article>
            )
          })}
        </div>
      )}

      <button type="button" className="btn btn-ghost btn-sm" onClick={() => setTick((t) => t + 1)}>
        Refresh list
      </button>
    </section>
  )
}
