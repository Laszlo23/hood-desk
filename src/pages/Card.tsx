import { useEffect, useState } from 'react'
import { DeskShareCard } from '../components/DeskShareCard'
import { cardFromHash, type DeskCardData, type DeskMark } from '../lib/deskCard'
import { publishNightScore } from '../lib/nightBoard'
import { fetchHoodSeederBalance } from '../lib/nfts/hoodseeder'
import { fetchInnerCircleBalance } from '../lib/nfts/innerCircle'
import type { ViewId } from '../lib/nav'

type Props = { onNavigate: (id: ViewId) => void }

export function CardPage({ onNavigate }: Props) {
  const [card, setCard] = useState<DeskCardData | null>(() => cardFromHash(window.location.hash))

  useEffect(() => {
    const read = () => setCard(cardFromHash(window.location.hash))
    read()
    window.addEventListener('hashchange', read)
    return () => window.removeEventListener('hashchange', read)
  }, [])

  useEffect(() => {
    if (!card || card.night <= 0) return
    publishNightScore(card.address, card.night, card.best)
  }, [card])

  useEffect(() => {
    if (!card?.address) return
    let cancelled = false
    void Promise.all([
      fetchHoodSeederBalance(card.address),
      fetchInnerCircleBalance(card.address),
    ]).then(([seeder, circle]) => {
      if (cancelled) return
      setCard((current) => {
        if (!current) return current
        const deskMarks = current.marks.filter((mark) => mark !== 'seeder' && mark !== 'circle')
        const chain: DeskMark[] = []
        if (seeder !== null && seeder > 0n) chain.push('seeder')
        else if (seeder === null && current.marks.includes('seeder')) chain.push('seeder')
        if (circle !== null && circle > 0n) chain.push('circle')
        else if (circle === null && current.marks.includes('circle')) chain.push('circle')
        return { ...current, marks: [...deskMarks, ...chain] }
      })
    })
    return () => {
      cancelled = true
    }
  }, [card?.address])

  return (
    <section className="page card-page">
      <div className="page-intro">
        <p className="eyebrow">A card from the wood</p>
        <h1>Desk card</h1>
      </div>
      <DeskShareCard card={card} shared />
      <div className="cta-row mt">
        <button type="button" className="btn btn-ghost btn-sm" onClick={() => onNavigate('trade')}>
          Trade
        </button>
        <button type="button" className="btn btn-ghost btn-sm" onClick={() => onNavigate('account')}>
          Your card
        </button>
      </div>
    </section>
  )
}
