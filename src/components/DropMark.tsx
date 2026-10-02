import { dropCells, paletteInk, type DropPalette } from '../lib/drops'

type Props = {
  seed: string
  palette: DropPalette
  edition?: number
  size?: number
  title?: string
}

export function DropMark({ seed, palette, edition = 1, size = 96, title }: Props) {
  const cells = dropCells(seed, edition)
  const ink = paletteInk(palette)
  const cell = size / 8
  return (
    <svg
      className="drop-mark"
      width={size}
      height={size}
      viewBox={`0 0 ${size} ${size}`}
      role="img"
      aria-label={title ?? 'Collection mark'}
    >
      {cells.map((value, index) => (
        <rect
          key={index}
          x={(index % 8) * cell}
          y={Math.floor(index / 8) * cell}
          width={cell}
          height={cell}
          fill={ink[value] ?? ink[0]}
        />
      ))}
    </svg>
  )
}
