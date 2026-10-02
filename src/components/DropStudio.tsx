import { useMemo, useState, type FormEvent } from 'react'
import { useAccount } from 'wagmi'
import { DropMark } from './DropMark'
import { awardXp, XP_REWARDS } from '../lib/gamification'
import { deskId } from '../lib/nightDesk'
import {
  DROP_PALETTES,
  dropBar,
  freshSeed,
  paletteLabel,
  publishDrop,
  type DropPalette,
} from '../lib/drops'
import type { ViewId } from '../lib/nav'

type Props = { onNavigate: (id: ViewId, projectId?: string) => void }

const SIZES = [24, 48, 96, 144] as const

export function DropStudio({ onNavigate }: Props) {
  const { address } = useAccount()
  const [name, setName] = useState('')
  const [line, setLine] = useState('')
  const [forWhom, setForWhom] = useState('')
  const [palette, setPalette] = useState<DropPalette>('night')
  const [seed, setSeed] = useState(freshSeed)
  const [supply, setSupply] = useState<(typeof SIZES)[number]>(48)
  const [pledge, setPledge] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [note, setNote] = useState('')
  const previews = useMemo(() => [1, 2, 3, 4], [])

  const press = async (e: FormEvent) => {
    e.preventDefault()
    const input = {
      name,
      line,
      forWhom,
      palette,
      seed,
      supply,
      maker: address ?? deskId(),
      pledge,
    }
    const problem = dropBar(input)
    if (problem) {
      setError(problem)
      setNote('')
      return
    }
    setBusy(true)
    setError('')
    try {
      const drop = await publishDrop(input)
      const paid = awardXp('publish_drop', { once: true })
      setNote(
        paid.awarded > 0
          ? `${drop.name} is on the board. This browser earned ${paid.awarded} XP. That XP stays on your card. It is not a mint.`
          : `${drop.name} is on the board. This browser already took the first-press XP. The collection is still public.`,
      )
      setName('')
      setLine('')
      setForWhom('')
      setPledge(false)
      setSeed(freshSeed())
    } catch (err) {
      setError(err instanceof Error ? err.message : 'The desk did not press this collection.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <form className="card form-card drop-studio" onSubmit={press}>
      <p className="eyebrow">The press</p>
      <h2 className="section-title">Make a collection on this desk</h2>
      <p className="muted">
        The pictures, the edition size, and the public page live here. OpenSea does not host them
        and does not set the size. Pressing does not mint. A chain contract would be a later step
        your wallet signs.
      </p>
      <p className="tiny muted">
        The first collection from this browser adds {XP_REWARDS.publish_drop} XP and the Creator
        mark on your card. Later collections still join the board. The XP is not HOOD and it is not
        a payout.
      </p>

      <div className="drop-preview" aria-label="Four marks from this seed">
        {previews.map((edition) => (
          <DropMark key={edition} seed={seed} palette={palette} edition={edition} size={88} title={`${name || 'Drop'} #${edition}`} />
        ))}
      </div>

      <div className="drop-tools">
        <button type="button" className="btn btn-quiet btn-sm" onClick={() => setSeed(freshSeed())}>
          Roll the pictures
        </button>
        <span className="tiny muted mono">Seed {seed}</span>
      </div>

      <label className="field">
        <span className="rail-label">Collection name</span>
        <input className="input" value={name} onChange={(e) => setName(e.target.value)} placeholder="Night lanterns" maxLength={32} required />
      </label>
      <label className="field">
        <span className="rail-label">What it is</span>
        <textarea
          className="input"
          value={line}
          onChange={(e) => setLine(e.target.value)}
          placeholder="Pixel lanterns for people who show up on the desk. One picture per edition, drawn from the seed."
          rows={3}
          required
        />
      </label>
      <label className="field">
        <span className="rail-label">Who it is for</span>
        <input className="input" value={forWhom} onChange={(e) => setForWhom(e.target.value)} placeholder="People making their first collection" required />
      </label>

      <div className="field">
        <span className="rail-label">Palette</span>
        <div className="drop-choices">
          {DROP_PALETTES.map((id) => (
            <button
              key={id}
              type="button"
              className={`btn btn-sm ${palette === id ? 'btn-primary' : 'btn-quiet'}`}
              onClick={() => setPalette(id)}
            >
              {paletteLabel(id)}
            </button>
          ))}
        </div>
      </div>

      <div className="field">
        <span className="rail-label">Edition size</span>
        <div className="drop-choices">
          {SIZES.map((size) => (
            <button
              key={size}
              type="button"
              className={`btn btn-sm ${supply === size ? 'btn-primary' : 'btn-quiet'}`}
              onClick={() => setSupply(size)}
            >
              {size}
            </button>
          ))}
        </div>
      </div>

      <label className="paper-check">
        <input type="checkbox" checked={pledge} onChange={(e) => setPledge(e.target.checked)} />
        <span>One edition. No second mint. No promise the price goes up. The pictures stay on this desk.</span>
      </label>

      {error ? <p className="form-error">{error}</p> : null}
      {note ? (
        <p className="muted">
          {note}{' '}
          <button type="button" className="link-btn" onClick={() => onNavigate('projects')}>
            See the board
          </button>
        </p>
      ) : null}

      <button type="submit" className="btn btn-primary" disabled={busy}>
        {busy ? 'Pressing…' : 'Press the collection'}
      </button>
    </form>
  )
}
