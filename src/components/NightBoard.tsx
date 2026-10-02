import { useEffect, useState } from 'react'
import { readBoard, type BoardRow } from '../lib/nightBoard'
import { fetchNightDesk, onNightDesk, type Jackpot } from '../lib/nightDesk'
import { shortDeskAddress } from '../lib/deskCard'

type Props = {
  highlight?: string | null
  limit?: number
}

function rowKey(address: string | null | undefined): string {
  return address ? address.toLowerCase() : 'local'
}

export function NightBoard({ highlight = null, limit = 8 }: Props) {
  const you = rowKey(highlight)
  const [rows, setRows] = useState<BoardRow[]>(() => readBoard())
  const [pot, setPot] = useState<Jackpot | null>(null)

  useEffect(() => {
    let live = true
    const pull = () => {
      fetchNightDesk()
        .then((desk) => {
          if (!live || !desk) return
          if (desk.board.length > 0) setRows(desk.board)
          setPot(desk.jackpot)
        })
        .catch(() => {
          if (live) setRows(readBoard())
        })
    }
    pull()
    const stop = onNightDesk(() => {
      if (live) pull()
    })
    return () => {
      live = false
      stop()
    }
  }, [])

  return (
    <div>
      {pot ? (
        <p className="wood-standing">
          {pot.label} pot {pot.pot.toLocaleString('en-US')}. Best run {pot.best.toLocaleString('en-US')}. The pot is desk points, kept on the server.
        </p>
      ) : null}
      {rows.length === 0 ? (
        <p className="muted">The wood is quiet. Come home with gold and this board learns your name.</p>
      ) : (
        <ol className="night-board">
          {rows.slice(0, limit).map((row, index) => (
            <BoardLine
              key={row.id}
              row={row}
              place={index + 1}
              yours={row.id === you || row.address === you || (you === 'local' && row.id === 'local')}
            />
          ))}
        </ol>
      )}
    </div>
  )
}

function BoardLine({ row, place, yours }: { row: BoardRow; place: number; yours: boolean }) {
  const name = row.address ? shortDeskAddress(row.address) : 'A desk'
  return (
    <li className={yours ? 'is-you' : undefined}>
      <span>{place}</span>
      <b>{yours && !row.address ? 'You' : name}</b>
      <strong>{row.total.toLocaleString('en-US')}</strong>
    </li>
  )
}
