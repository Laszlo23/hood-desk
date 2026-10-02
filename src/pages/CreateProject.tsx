import { useState, type FormEvent } from 'react'
import { useAccount } from 'wagmi'
import { DropStudio } from '../components/DropStudio'
import { createProject, suggestTickerFromName } from '../lib/projects'
import { buildBar, publishBuild } from '../lib/builders'
import { deskId } from '../lib/nightDesk'
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
  const [forWhom, setForWhom] = useState('')
  const [listOnDesk, setListOnDesk] = useState(true)
  const [pledge, setPledge] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  const submit = async (e: FormEvent) => {
    e.preventDefault()
    if (!name.trim()) {
      setError('Project name is required.')
      return
    }
    const link = website.trim() || twitter.trim() || farcaster.trim()
    if (listOnDesk) {
      const problem = buildBar({
        name,
        work: description,
        forWhom,
        link,
        maker: address ?? deskId(),
        pledge,
      })
      if (problem) {
        setError(problem)
        return
      }
    }
    setBusy(true)
    setError('')
    try {
      if (listOnDesk) {
        await publishBuild({
          name,
          work: description,
          forWhom,
          link,
          maker: address ?? deskId(),
          pledge,
        })
      }
    } catch (err) {
      setBusy(false)
      setError(err instanceof Error ? err.message : 'The desk did not list this project.')
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
    setBusy(false)
    onNavigate('project', project.id)
  }

  return (
    <section className="page create-page">
      <div className="page-intro">
        <p className="eyebrow">People’s launchpad</p>
        <h1>Press something of your own</h1>
        <p className="muted">
          This desk is for people who make things. A collection pressed here stays on this page.
          OpenSea does not host it. A build you list still needs a real link, a person it helps,
          and one mint if there is a token. A promise of profit is not listed.
        </p>
        <p className="tiny muted">
          Create the card, deploy the token, paste the address, then trade. The swaps land on the{' '}
          <button type="button" className="link-btn" onClick={() => onNavigate('rewards')}>ledger</button>.
        </p>
      </div>

      <DropStudio onNavigate={onNavigate} />

      <h2 className="section-title build-yours">Or list a build</h2>
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
          <span className="rail-label">What you built</span>
          <textarea
            className="input textarea"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="A tool, a game, a mint, or a contract. What it does, in plain words."
            rows={4}
          />
        </label>

        <label className="field">
          <span className="rail-label">Who it is for</span>
          <input
            className="input"
            value={forWhom}
            onChange={(e) => setForWhom(e.target.value)}
            placeholder="Artists on Robinhood Chain who need a gallery"
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

        <label className="field paper-check">
          <input type="checkbox" checked={listOnDesk} onChange={(e) => setListOnDesk(e.target.checked)} />
          <span>List this on the desk so other people can open it</span>
        </label>
        {listOnDesk ? (
          <label className="field paper-check">
            <input type="checkbox" checked={pledge} onChange={(e) => setPledge(e.target.checked)} />
            <span>One mint if there is a token. No tax. No second mint. No promise that the price goes up.</span>
          </label>
        ) : null}

        {error && <p className="err-line form-err">{error}</p>}

        <div className="cta-row">
          <button type="submit" className="btn btn-primary" disabled={busy}>
            {busy ? 'Listing…' : 'Create project'}
          </button>
          <button type="button" className="btn btn-ghost" onClick={() => onNavigate('projects')}>
            View projects
          </button>
        </div>
      </form>
    </section>
  )
}
