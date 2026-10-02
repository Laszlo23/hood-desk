import { useEffect, useState } from 'react'
import { DropMark } from './DropMark'
import { fetchDrops, paletteLabel, type DeskDrop, type DropPalette } from '../lib/drops'

function knownPalette(value: string): DropPalette {
  if (value === 'amber' || value === 'ice' || value === 'night') return value
  return 'night'
}

export function DropBoard() {
  const [drops, setDrops] = useState<DeskDrop[] | null>(null)

  useEffect(() => {
    let live = true
    fetchDrops()
      .then((rows) => {
        if (live) setDrops(rows)
      })
      .catch(() => {
        if (live) setDrops([])
      })
    return () => {
      live = false
    }
  }, [])

  return (
    <div className="drop-board">
      <div className="row-between">
        <div>
          <p className="eyebrow">People’s board</p>
          <h2 className="section-title">Collections pressed here</h2>
        </div>
      </div>
      <p className="muted">
        Each card is a collection this desk hosts. The pictures are drawn from a seed. They are not
        a chain mint, and OpenSea does not list them.
      </p>
      {drops === null ? <p className="muted">Reading the board…</p> : null}
      {drops && drops.length === 0 ? (
        <article className="card">
          <p className="muted">No collections yet. The first press sets the board.</p>
        </article>
      ) : null}
      {drops && drops.length > 0 ? (
        <div className="drop-grid">
          {drops.map((drop) => (
            <article key={drop.id} className="card drop-card">
              <DropMark seed={drop.seed} palette={knownPalette(drop.palette)} edition={1} size={112} title={drop.name} />
              <div>
                <p className="eyebrow">
                  {drop.supply} · {paletteLabel(knownPalette(drop.palette))}
                </p>
                <h3 className="section-title">{drop.name}</h3>
                <p>{drop.line}</p>
                <p className="muted tiny">For {drop.forWhom}</p>
              </div>
            </article>
          ))}
        </div>
      ) : null}
    </div>
  )
}
