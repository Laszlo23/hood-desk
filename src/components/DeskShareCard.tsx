import { useEffect, useState } from 'react'
import { useAccount } from 'wagmi'
import { HoodMark } from './HoodMark'
import {
  DESK_MARK_LABEL,
  buildLocalCard,
  cardShareUrl,
  type DeskCardData,
  type DeskMark,
  shortDeskAddress,
} from '../lib/deskCard'
import { fetchHoodSeederBalance } from '../lib/nfts/hoodseeder'
import { fetchInnerCircleBalance } from '../lib/nfts/innerCircle'

type Props = {
  card?: DeskCardData | null
  shared?: boolean
}

export function DeskShareCard({ card: given, shared = false }: Props) {
  const { address } = useAccount()
  const [chainMarks, setChainMarks] = useState<DeskMark[]>([])
  const [note, setNote] = useState<string | null>(null)

  useEffect(() => {
    if (shared) return
    let cancelled = false
    if (!address) {
      setChainMarks([])
      return
    }
    void Promise.all([fetchHoodSeederBalance(address), fetchInnerCircleBalance(address)]).then(
      ([seeder, circle]) => {
        if (cancelled) return
        const next: DeskMark[] = []
        if (seeder !== null && seeder > 0n) next.push('seeder')
        if (circle !== null && circle > 0n) next.push('circle')
        setChainMarks(next)
      },
    )
    return () => {
      cancelled = true
    }
  }, [address, shared])

  const card = shared ? given : buildLocalCard(address ?? null, chainMarks)
  if (!card) {
    return (
      <article className="desk-share-card">
        <p className="muted">This link does not hold a card.</p>
      </article>
    )
  }

  const share = async () => {
    const url = cardShareUrl(card)
    let copied = false
    try {
      await navigator.clipboard.writeText(url)
      copied = true
    } catch {
      copied = false
    }
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Hood Desk card',
          text: `${shortDeskAddress(card.address)} · level ${card.level}`,
          url,
        })
      } catch {
        /* the sheet was closed; the link is already copied when the browser allowed it */
      }
    }
    setNote(copied ? 'Link copied.' : url)
  }

  return (
    <article className="desk-share-card">
      <div className="desk-share-top">
        <HoodMark size={64} variant="logo" />
        <div>
          <p className="eyebrow">Hood Desk</p>
          <h2 className="desk-share-name">{shortDeskAddress(card.address)}</h2>
          <p className="tiny muted">Robinhood Chain · 4663</p>
        </div>
      </div>
      <div className="desk-share-stats">
        <div>
          <span className="rail-label">Level</span>
          <strong>{card.level}</strong>
        </div>
        <div>
          <span className="rail-label">Mornings</span>
          <strong>{card.streak}</strong>
        </div>
        <div>
          <span className="rail-label">Swaps</span>
          <strong>{card.swaps}</strong>
        </div>
        <div>
          <span className="rail-label">Night</span>
          <strong>{(card.night || 0).toLocaleString('en-US')}</strong>
        </div>
        <div>
          <span className="rail-label">Best run</span>
          <strong>{(card.best || 0).toLocaleString('en-US')}</strong>
        </div>
      </div>
      <ul className="desk-share-marks">
        {card.marks.length === 0 ? (
          <li className="muted">Marks show up after a signed swap, three mornings, or a desk NFT.</li>
        ) : (
          card.marks.map((mark) => <li key={mark}>{DESK_MARK_LABEL[mark]}</li>)
        )}
      </ul>
      <p className="tiny muted">
        {shared
          ? 'The night score came with the card. A Seeder pass or Inner Circle mark stays when the chain still holds it.'
          : 'The night score lives on this card, beside the marks. Share it and the wood can learn the name. It is not written into a chain token.'}
      </p>
      {shared ? null : (
        <button type="button" className="btn btn-primary btn-sm" onClick={() => void share()}>
          Share card
        </button>
      )}
      {note ? <p className="tiny">{note}</p> : null}
    </article>
  )
}
