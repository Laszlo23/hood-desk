import { useEffect, useState } from 'react'
import { loadHoodPoolChart } from '../lib/trade/poolCandles'
import { fetchNightDesk, shareDeskLine, type Jackpot } from '../lib/nightDesk'
import { shortDeskAddress } from '../lib/deskCard'

function hoodLine(ethPerHood: number) {
  if (!(ethPerHood > 0)) return 'The pool price is still loading.'
  const perEth = 1 / ethPerHood
  return `1 ETH buys ${perEth.toLocaleString('en-US', { maximumFractionDigits: 0 })} HOOD`
}

export function DeskPulse() {
  const [price, setPrice] = useState<number | null>(null)
  const [pot, setPot] = useState<Jackpot | null>(null)
  const [note, setNote] = useState('')

  useEffect(() => {
    let live = true
    loadHoodPoolChart('15m')
      .then((chart) => {
        if (live) setPrice(chart.price)
      })
      .catch(() => {
        if (live) setPrice(null)
      })
    fetchNightDesk()
      .then((desk) => {
        if (live && desk) setPot(desk.jackpot)
      })
      .catch(() => {
        if (live) setPot(null)
      })
    return () => {
      live = false
    }
  }, [])

  const share = () => {
    const potText = pot ? `The week's pot is ${pot.pot.toLocaleString('en-US')}.` : 'The wood is open.'
    void shareDeskLine(`${hoodLine(price ?? 0)} ${potText}`).then((result) => {
      if (result === 'copied') setNote('Copied')
      if (result === 'shared') setNote('Shared')
    })
  }

  const holder = pot?.holder ? shortDeskAddress(pot.holder) : 'nobody yet'

  return (
    <section className="desk-pulse" aria-label="Desk pulse">
      <p>
        <b>{price && price > 0 ? hoodLine(price) : 'Reading the pool…'}</b>
      </p>
      <p className="tiny muted">
        Seeder and Inner Circle are minted on this desk. They are not listed, so there is no sale price.
      </p>
      {pot ? (
        <p>
          {pot.label} pot <b>{pot.pot.toLocaleString('en-US')}</b>
          <span className="tiny muted"> · {pot.runs} homecomings · held by {holder}</span>
        </p>
      ) : (
        <p className="tiny muted">The week's pot opens when someone comes home.</p>
      )}
      <button type="button" className="btn btn-ghost btn-sm" onClick={share}>
        {note || 'Share the wood'}
      </button>
    </section>
  )
}
