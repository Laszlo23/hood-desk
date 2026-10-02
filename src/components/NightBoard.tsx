import { readBoard, type BoardRow } from '../lib/nightBoard'
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
  const rows = readBoard().slice(0, limit)
  if (rows.length === 0) {
    return <p className="muted">The wood is quiet. Come home with gold and this board learns your name.</p>
  }
  return (
    <ol className="night-board">
      {rows.map((row, index) => (
        <BoardLine key={row.id} row={row} place={index + 1} yours={row.id === you || (you === 'local' && row.id === 'local')} />
      ))}
    </ol>
  )
}

function BoardLine({ row, place, yours }: { row: BoardRow; place: number; yours: boolean }) {
  const name = row.address ? shortDeskAddress(row.address) : 'This desk'
  return (
    <li className={yours ? 'is-you' : undefined}>
      <span>{place}</span>
      <b>{yours && !row.address ? 'You' : name}</b>
      <strong>{row.total.toLocaleString('en-US')}</strong>
    </li>
  )
}
