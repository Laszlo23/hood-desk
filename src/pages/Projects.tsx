import { useEffect, useMemo, useState } from 'react'
import { useAccount } from 'wagmi'
import { fetchBuilds, type DeskBuild } from '../lib/builders'
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
  const [builds, setBuilds] = useState<DeskBuild[] | null>(null)
  const projects = useMemo(() => {
    void tick
    return listProjects(address)
  }, [address, tick])

  useEffect(() => {
    let live = true
    fetchBuilds()
      .then((rows) => {
        if (live) setBuilds(rows)
      })
      .catch(() => {
        if (live) setBuilds([])
      })
    return () => {
      live = false
    }
  }, [])

  return (
    <section className="page projects-page">
      <div className="page-intro row-between">
        <div>
          <p className="eyebrow">Builders</p>
          <h1>Projects</h1>
          <p className="muted">
            The public list is work other people put on the desk. Yours also stays in this browser
            under <code className="inline-code">{storageOwnerKey(address)}</code>. A token, if there
            is one, is one mint, no tax, and no second mint.
          </p>
        </div>
        <button type="button" className="btn btn-primary" onClick={() => onNavigate('create')}>
          + Create
        </button>
      </div>

      <div className="build-board">
        {builds === null ? <p className="muted">Reading the builder list…</p> : null}
        {builds && builds.length === 0 ? (
          <article className="card">
            <p className="eyebrow">Open desk</p>
            <h2 className="section-title">No public projects yet</h2>
            <p className="muted">
              The first listing needs a name, what you built, who it is for, and a link. The desk
              does not list a promise of profit.
            </p>
          </article>
        ) : null}
        {builds && builds.length > 0
          ? builds.map((build) => (
              <article key={build.id} className="card build-card">
                <p className="eyebrow">{new Date(build.at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</p>
                <h2 className="section-title">{build.name}</h2>
                <p>{build.work}</p>
                <p className="muted">For {build.forWhom}</p>
                <a className="btn btn-quiet btn-sm" href={build.link} target="_blank" rel="noreferrer">
                  Open the work
                </a>
              </article>
            ))
          : null}
      </div>

      <h2 className="section-title build-yours">In this browser</h2>

      {projects.length === 0 ? (
        <div className="card empty-card">
          <HoodSeal size={56} decorative className="empty-seal" />
          <p className="eyebrow">Empty desk</p>
          <h2>No projects yet</h2>
          <p className="muted">
            A project is a name and a fair-launch plan saved on this desk. The token is real only
            after you deploy it and paste the address.
          </p>
          <div className="cta-row mt">
            <button type="button" className="btn btn-primary" onClick={() => onNavigate('create')}>
              Create project
            </button>
            <button type="button" className="btn btn-ghost" onClick={() => onNavigate('blog')}>
              Read Hood Street posts
            </button>
            <button type="button" className="btn btn-ghost" onClick={() => onNavigate('trade')}>
              Trade $HOOD
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
