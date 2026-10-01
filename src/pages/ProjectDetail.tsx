import { useMemo, useState } from 'react'
import { useAccount } from 'wagmi'
import { FairLaunchWizard } from '../components/FairLaunchWizard'
import { EXPLORER_TOKEN } from '../lib/chain'
import { VerifiedBadge } from '../components/VerifiedBadge'
import { explorerVerifyUrl } from '../lib/verify/onchainVerified'
import {
  FAIR_LAUNCH_COPY,
  getProject,
  socialChips,
  toggleLpChecklistItem,
  type Project,
} from '../lib/projects'
import type { ViewId } from '../lib/nav'

type Props = {
  projectId?: string
  onNavigate: (id: ViewId, projectId?: string) => void
}

export function ProjectDetail({ projectId, onNavigate }: Props) {
  const { address } = useAccount()
  const [wizardOpen, setWizardOpen] = useState(false)
  const [version, setVersion] = useState(0)

  const project = useMemo(() => {
    void version
    if (!projectId) return null
    return getProject(projectId, address)
  }, [projectId, address, version])

  if (!projectId || !project) {
    return (
      <section className="page">
        <div className="card">
          <p>Project not found.</p>
          <button type="button" className="btn btn-primary mt" onClick={() => onNavigate('projects')}>
            Back to projects
          </button>
        </div>
      </section>
    )
  }

  const chips = socialChips(project.socials)
  const fl = project.fairLaunch

  const onUpdated = (p: Project) => {
    void p
    setVersion((v) => v + 1)
  }

  return (
    <section className="page project-detail-page">
      <div className="page-intro">
        <button type="button" className="link-btn" onClick={() => onNavigate('projects')}>
          ← Projects
        </button>
        <div className="row-gap mt">
          {project.logoUrl ? (
            <img src={project.logoUrl} alt="" className="project-logo lg" />
          ) : (
            <span className="project-emoji lg" aria-hidden>
              {project.avatarEmoji || '🦊'}
            </span>
          )}
          <div>
            <p className="eyebrow">Project</p>
            <h1>
              {project.name}
              {project.ticker ? (
                <span className="ticker-tag">
                  {' '}
                  ${project.ticker}
                  {fl?.tokenAddress ? <VerifiedBadge address={fl.tokenAddress} /> : null}
                </span>
              ) : null}
            </h1>
            <p className="muted">{project.description || 'No description'}</p>
          </div>
        </div>
      </div>

      {chips.length > 0 && (
        <div className="chip-row">
          {chips.map((c) => (
            <a key={c.label} className="social-chip" href={c.href} target="_blank" rel="noreferrer">
              {c.label}
            </a>
          ))}
        </div>
      )}

      <div className="detail-grid">
        <article className="card">
          <p className="eyebrow">Agent persona</p>
          <p>{project.agentPersona || 'Default Desk fox — witty, RH-only, fair launches only.'}</p>
        </article>

        <article className="card">
          <div className="row-between">
            <div>
              <p className="eyebrow">Token</p>
              <h2 className="section-title">Fair launch</h2>
              <p className="muted small">{FAIR_LAUNCH_COPY}</p>
            </div>
            <span className="badge">Fair launch only</span>
          </div>

          {fl ? (
            <ul className="spec-list">
              <li>
                <span className="rail-label">Status</span>
                <span>
                  <strong>{fl.status}</strong>
                </span>
              </li>
              <li>
                <span className="rail-label">Name / symbol</span>
                <span className="token-name-row">
                  {fl.name} / ${fl.symbol}
                  {fl.tokenAddress ? <VerifiedBadge address={fl.tokenAddress} /> : null}
                </span>
              </li>
              <li>
                <span className="rail-label">Supply</span>
                <span>
                  {fl.supply} · {fl.decimals} decimals
                </span>
              </li>
              {fl.tokenAddress && (
                <li>
                  <span className="rail-label">tokenAddress</span>
                  <span className="mono">
                    <a href={EXPLORER_TOKEN(fl.tokenAddress)} target="_blank" rel="noreferrer">
                      {fl.tokenAddress}
                    </a>
                  </span>
                </li>
              )}
            </ul>
          ) : (
            <p className="muted mt">No fair-launch record yet.</p>
          )}

          <div className="cta-row">
            <button type="button" className="btn btn-primary" onClick={() => setWizardOpen(true)}>
              {fl ? 'Open fair launch wizard' : 'Launch fair token'}
            </button>
            {fl?.tokenAddress && (
              <button type="button" className="btn btn-ghost" onClick={() => onNavigate('trade')}>
                Trade this token →
              </button>
            )}
            <button type="button" className="btn btn-ghost" onClick={() => onNavigate('rewards')}>
              See the ledger →
            </button>
          </div>
          <p className="tiny muted mt">
            A token shows up on Trade after you paste its deployed address.
          </p>
        </article>
      </div>

      {fl && (
        <article className="card">
          <p className="eyebrow">Post-deploy</p>
          <h2 className="section-title">LP checklist (TODO DEX)</h2>
          <p className="muted small">
            No invented routers. Toggle items as you complete them off-app.
          </p>
          <ul className="checklist">
            {fl.lpChecklist.map((item) => (
              <li key={item.id}>
                <label className="check-row">
                  <input
                    type="checkbox"
                    checked={item.done}
                    onChange={() => {
                      toggleLpChecklistItem(project.id, item.id, address)
                      setVersion((v) => v + 1)
                    }}
                  />
                  <span>
                    {item.id === 'verify' ? 'Verify contract on explorer' : item.label}
                    {item.id === 'verify' && fl.tokenAddress ? (
                      <>
                        {' '}
                        <a
                          href={explorerVerifyUrl(fl.tokenAddress)}
                          target="_blank"
                          rel="noreferrer"
                          className="link-inline"
                          onClick={(e) => e.stopPropagation()}
                        >
                          Blockscout →
                        </a>
                        {' '}
                        <VerifiedBadge address={fl.tokenAddress} />
                      </>
                    ) : null}
                  </span>
                </label>
              </li>
            ))}
          </ul>
        </article>
      )}

      {wizardOpen && (
        <FairLaunchWizard
          project={project}
          address={address}
          onUpdated={onUpdated}
          onClose={() => setWizardOpen(false)}
        />
      )}
    </section>
  )
}
