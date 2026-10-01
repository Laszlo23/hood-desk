import { useState, type FormEvent } from 'react'
import { useAccount } from 'wagmi'
import { createProject, suggestTickerFromName } from '../lib/projects'
import { awardXp } from '../lib/gamification'
import type { ViewId } from '../lib/nav'

type Props = {
  onNavigate: (id: ViewId, projectId?: string) => void
}

export function CreateProject({ onNavigate }: Props) {
  const { address } = useAccount()
  const [name, setName] = useState('')
  const [ticker, setTicker] = useState('')
  const [description, setDescription] = useState('')
  const [website, setWebsite] = useState('')
  const [twitter, setTwitter] = useState('')
  const [farcaster, setFarcaster] = useState('')
  const [discord, setDiscord] = useState('')
  const [telegram, setTelegram] = useState('')
  const [logoUrl, setLogoUrl] = useState('')
  const [avatarEmoji, setAvatarEmoji] = useState('🦊')
  const [agentPersona, setAgentPersona] = useState('')
  const [error, setError] = useState('')

  const submit = (e: FormEvent) => {
    e.preventDefault()
    if (!name.trim()) {
      setError('Project name is required.')
      return
    }
    const project = createProject(
      {
        name,
        ticker: ticker || undefined,
        description,
        socials: { website, twitter, farcaster, discord, telegram },
        logoUrl: logoUrl || undefined,
        avatarEmoji: avatarEmoji || '🦊',
        agentPersona: agentPersona || undefined,
      },
      address,
    )
    awardXp('create_project')
    onNavigate('project', project.id)
  }

  return (
    <section className="page create-page">
      <div className="page-intro">
        <p className="eyebrow">Launchpad</p>
        <h1>Create project</h1>
        <p className="muted">
          Name your AI business, attach socials, set the agent voice. Then fair-launch a token from
          the project page. Stored in localStorage (wallet key or <code className="inline-code">anon</code>).
        </p>
        <p className="tiny muted">
          Create the card, deploy the token, paste the address, then trade. The swaps land on the{' '}
          <button type="button" className="link-btn" onClick={() => onNavigate('rewards')}>ledger</button>.
        </p>
      </div>

      <form className="card form-card" onSubmit={submit}>
        <label className="field">
          <span className="rail-label">Project name *</span>
          <input
            className="input"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Neon Fox Desk"
            required
          />
        </label>

        <div className="form-row">
          <label className="field">
            <span className="rail-label">Ticker (optional until token)</span>
            <input
              className="input"
              value={ticker}
              onChange={(e) => setTicker(e.target.value.toUpperCase())}
              placeholder="FOX"
              maxLength={8}
            />
          </label>
          <button
            type="button"
            className="btn btn-ghost btn-sm suggest-btn"
            onClick={() => setTicker(suggestTickerFromName(name || 'Hood'))}
          >
            Suggest
          </button>
        </div>

        <label className="field">
          <span className="rail-label">One-liner / description</span>
          <textarea
            className="input textarea"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="AI-run trading desk on Robinhood Chain…"
            rows={3}
          />
        </label>

        <p className="rail-label">Social links (optional)</p>
        <div className="form-grid">
          <label className="field">
            <span className="muted small">Website</span>
            <input className="input" value={website} onChange={(e) => setWebsite(e.target.value)} placeholder="https://" />
          </label>
          <label className="field">
            <span className="muted small">X / Twitter</span>
            <input className="input" value={twitter} onChange={(e) => setTwitter(e.target.value)} placeholder="https://x.com/…" />
          </label>
          <label className="field">
            <span className="muted small">Farcaster</span>
            <input className="input" value={farcaster} onChange={(e) => setFarcaster(e.target.value)} placeholder="https://warpcast.com/…" />
          </label>
          <label className="field">
            <span className="muted small">Discord</span>
            <input className="input" value={discord} onChange={(e) => setDiscord(e.target.value)} placeholder="https://discord.gg/…" />
          </label>
          <label className="field">
            <span className="muted small">Telegram</span>
            <input className="input" value={telegram} onChange={(e) => setTelegram(e.target.value)} placeholder="https://t.me/…" />
          </label>
        </div>

        <div className="form-grid">
          <label className="field">
            <span className="rail-label">Logo URL</span>
            <input className="input" value={logoUrl} onChange={(e) => setLogoUrl(e.target.value)} placeholder="https://…/logo.png" />
          </label>
          <label className="field">
            <span className="rail-label">Emoji avatar</span>
            <input className="input" value={avatarEmoji} onChange={(e) => setAvatarEmoji(e.target.value)} placeholder="🦊" maxLength={4} />
          </label>
        </div>

        <label className="field">
          <span className="rail-label">Agent persona blurb</span>
          <textarea
            className="input textarea"
            value={agentPersona}
            onChange={(e) => setAgentPersona(e.target.value)}
            placeholder="How should this AI business talk? e.g. witty fox, RH-only, ship fair launches…"
            rows={3}
          />
        </label>

        {error && <p className="err-line form-err">{error}</p>}

        <div className="cta-row">
          <button type="submit" className="btn btn-primary">
            Create project
          </button>
          <button type="button" className="btn btn-ghost" onClick={() => onNavigate('projects')}>
            View projects
          </button>
        </div>
      </form>
    </section>
  )
}
