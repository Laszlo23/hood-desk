import { useEffect, useState } from 'react'
import { useAccount } from 'wagmi'
import { nextHomePay, readNightSave } from '../game/nightMarks'
import { bestOf, placeOnBoard, publishNightScore } from '../lib/nightBoard'
import { fetchNightDesk, type Jackpot } from '../lib/nightDesk'
import { loadHoodLedger } from '../lib/trade/poolCandles'
import type { ViewId } from '../lib/nav'

type Props = { onNavigate: (id: ViewId) => void }

const STEPS = [
  { k: '1', title: 'Show up', image: '/lore/hood-show.jpg', line: 'Come home in Stay dark. A new day grows the streak. A missed day starts it over.' },
  { k: '2', title: 'The pay', image: '/lore/hood-pay.jpg', line: 'Day 2 adds 80 desk points. It climbs by 40 a day, and stops at 280.' },
  { k: '3', title: 'The week', image: '/lore/hood-week.jpg', line: 'Every homecoming adds to the public pot. The best run holds it.' },
  { k: '4', title: 'Again', image: '/lore/hood-again.jpg', line: 'The points are the prize for showing up. They are not HOOD and they are not ETH.' },
]

export function WoodWheel({ onNavigate }: Props) {
  const { address } = useAccount()
  const [carried, setCarried] = useState(0)
  const [streak, setStreak] = useState(0)
  const [standing, setStanding] = useState<{ place: number; of: number } | null>(null)
  const [pot, setPot] = useState<Jackpot | null>(null)
  const [feeEth, setFeeEth] = useState<number | null>(null)
  const [swaps, setSwaps] = useState(0)

  useEffect(() => {
    const save = readNightSave()
    if (save.total > 0) publishNightScore(address ?? null, save.total, bestOf(save.best), true)
    const place = placeOnBoard(address ?? null)
    setCarried(save.total)
    setStreak(save.streak)
    setStanding(place ? { place: place.place, of: place.of } : null)
    let live = true
    fetchNightDesk().then((desk) => {
      if (live && desk) setPot(desk.jackpot)
    })
    loadHoodLedger()
      .then((rows) => {
        if (!live) return
        const eth = rows.reduce((sum, row) => sum + row.eth, 0)
        setSwaps(rows.length)
        setFeeEth(eth * 0.01)
      })
      .catch(() => {
        if (live) setFeeEth(null)
      })
    return () => {
      live = false
    }
  }, [address])

  return (
    <section className="card wood-wheel" aria-label="The wood">
      <div className="lore-legend-head row-between">
        <div>
          <p className="eyebrow">Come back</p>
          <h2 className="section-title">The streak is the prize</h2>
        </div>
        <button type="button" className="btn btn-primary btn-sm" onClick={() => onNavigate('dark')}>
          Stay dark
        </button>
      </div>
      <p className="muted">
        Showing up is what this desk can reward. A new Vienna day adds desk points on the next homecoming.
        Those points stay on your card. They are not a payout, and they are not written into the coin.
      </p>
      <ol className="wood-loop">
        {STEPS.map((step) => (
          <li key={step.k}>
            <img src={step.image} alt="" />
            <b>
              {step.k} {step.title}
            </b>
            <span>{step.line}</span>
          </li>
        ))}
      </ol>
      <p className="wood-standing">
        {streak < 1
          ? 'No streak yet. Come home once. The day after, the run pays an extra 80 desk points.'
          : `Streak ${streak}. Come back tomorrow and the run pays an extra ${nextHomePay(streak).toLocaleString('en-US')} desk points.`}
      </p>
      {pot ? (
        <p className="wood-standing">
          {pot.label} pot {pot.pot.toLocaleString('en-US')}. {pot.runs} came home. The best run holds it.
        </p>
      ) : null}
      <p className="wood-standing">
        {feeEth == null
          ? 'Reading the pool fee from the public tape…'
          : `The public tape shows ${swaps.toLocaleString('en-US')} swaps. About ${feeEth.toLocaleString('en-US', { maximumFractionDigits: 4 })} ETH of the 1% fee stayed in the desk position. Ask did not place those swaps. That fee is not paid out.`}
      </p>
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
        <button type="button" className="btn btn-quiet" onClick={() => onNavigate('subscribe')}>
          What a plan pays for
        </button>
      </div>
    </section>
  )
}
