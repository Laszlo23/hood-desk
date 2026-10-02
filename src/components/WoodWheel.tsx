import { useEffect, useState } from 'react'
import { useAccount } from 'wagmi'
import { readNightSave } from '../game/nightMarks'
import { bestOf, placeOnBoard, publishNightScore } from '../lib/nightBoard'
import type { ViewId } from '../lib/nav'

type Props = { onNavigate: (id: ViewId) => void }

const STEPS = [
  { k: '1', title: 'Stay dark', line: 'Take what the rich left in the light.' },
  { k: '2', title: 'The pack', line: 'The gold counts onto your profile card.' },
  { k: '3', title: 'The board', line: 'The wood ranks who came home.' },
  { k: '4', title: 'Tonight', line: 'The house moves. The desk is still here.' },
]

export function WoodWheel({ onNavigate }: Props) {
  const { address } = useAccount()
  const [carried, setCarried] = useState(0)
  const [standing, setStanding] = useState<{ place: number; of: number } | null>(null)

  useEffect(() => {
    const save = readNightSave()
    if (save.total > 0) publishNightScore(address ?? null, save.total, bestOf(save.best), true)
    const place = placeOnBoard(address ?? null)
    setCarried(save.total)
    setStanding(place ? { place: place.place, of: place.of } : null)
  }, [address])

  return (
    <section className="card wood-wheel" aria-label="The wood">
      <div className="lore-legend-head row-between">
        <div>
          <p className="eyebrow">The flywheel</p>
          <h2 className="section-title">Gold comes home, then the wood asks again</h2>
        </div>
        <button type="button" className="btn btn-primary btn-sm" onClick={() => onNavigate('dark')}>
          Stay dark
        </button>
      </div>
      <p className="muted">
        A run fills the pack. The pack writes the profile card. The card takes a place on the board.
        Tonight the doors move, so the same skill is worth coming back for. A Seeder pass or Inner
        Circle mark already lives on that same card.
      </p>
      <ol className="wood-loop">
        {STEPS.map((step) => (
          <li key={step.k}>
            <b>
              {step.k} {step.title}
            </b>
            <span>{step.line}</span>
          </li>
        ))}
      </ol>
      {carried > 0 && standing ? (
        <p className="wood-standing">
          You carry {carried.toLocaleString('en-US')}. The wood has you at {standing.place} of {standing.of}.
        </p>
      ) : (
        <p className="wood-standing">No gold carried yet. The first homecoming opens the board.</p>
      )}
      <div className="hero-actions">
        <button type="button" className="btn btn-quiet" onClick={() => onNavigate('dark')}>
          Step into the dark
        </button>
        <button type="button" className="btn btn-quiet" onClick={() => onNavigate('account')}>
          Your card
        </button>
        <button type="button" className="btn btn-quiet" onClick={() => onNavigate('lore')}>
          The legend
        </button>
      </div>
    </section>
  )
}
