export const DROP_PALETTES = ['night', 'amber', 'ice'] as const

export type DropPalette = (typeof DROP_PALETTES)[number]

export type DeskDrop = {
  id: string
  at: string
  name: string
  line: string
  forWhom: string
  palette: DropPalette
  seed: string
  supply: number
  maker: string | null
}

export type DropInput = {
  name: string
  line: string
  forWhom: string
  palette: DropPalette
  seed: string
  supply: number
  maker: string | null
  pledge: boolean
}

const INK: Record<DropPalette, readonly [string, string, string, string]> = {
  night: ['#0c1210', '#163028', '#ccff00', '#f4ffe0'],
  amber: ['#140e08', '#3a2414', '#ffb020', '#fff1d0'],
  ice: ['#081018', '#143044', '#7ee7ff', '#e8fbff'],
}

export function paletteInk(palette: DropPalette): readonly [string, string, string, string] {
  return INK[palette]
}

export function paletteLabel(palette: DropPalette): string {
  switch (palette) {
    case 'night':
      return 'Night lime'
    case 'amber':
      return 'Amber'
    case 'ice':
      return 'Ice'
    default: {
      const _exhaustive: never = palette
      return _exhaustive
    }
  }
}

function mix(seed: string, n: number): number {
  let h = 2166136261
  const text = `${seed}:${n}`
  for (let i = 0; i < text.length; i += 1) {
    h ^= text.charCodeAt(i)
    h = Math.imul(h, 16777619)
  }
  return h >>> 0
}

/** Eight by eight, mirrored. Values are palette indexes. */
export function dropCells(seed: string, edition: number): number[] {
  const cells = new Array<number>(64).fill(0)
  for (let y = 0; y < 8; y += 1) {
    for (let x = 0; x < 4; x += 1) {
      const n = mix(seed, edition * 64 + y * 4 + x)
      const ink = y === 0 || y === 7 ? (n % 5 === 0 ? 2 : 0) : n % 5 === 0 ? 0 : (n % 3) + 1
      cells[y * 8 + x] = ink
      cells[y * 8 + (7 - x)] = ink
    }
  }
  cells[2 * 8 + 2] = 3
  cells[2 * 8 + 5] = 3
  return cells
}

export function freshSeed(): string {
  const bytes = new Uint8Array(4)
  crypto.getRandomValues(bytes)
  return [...bytes].map((byte) => byte.toString(16).padStart(2, '0')).join('')
}

export function dropBar(input: DropInput): string | null {
  if (input.name.trim().length < 2) return 'Give the collection a name.'
  if (input.line.trim().length < 40) return 'Say what the collection is, in a sentence or two.'
  if (input.forWhom.trim().length < 16) return 'Say who it is for.'
  if (!DROP_PALETTES.includes(input.palette)) return 'Pick a palette the desk knows.'
  if (!/^[a-f0-9]{8}$/.test(input.seed)) return 'Roll the picture once so it has a seed.'
  if (![24, 48, 96, 144].includes(input.supply)) {
    return 'An edition is 24, 48, 96, or 144. One size, then it stops.'
  }
  if (!input.pledge) return 'A drop agrees to one edition, no second mint, and no promise the price goes up.'
  return null
}

export async function fetchDrops(): Promise<DeskDrop[]> {
  const res = await fetch('/api/drops')
  if (!res.ok) throw new Error('The drop board did not load.')
  const data = (await res.json()) as { drops?: DeskDrop[] }
  return Array.isArray(data.drops) ? data.drops : []
}

export async function publishDrop(input: DropInput): Promise<DeskDrop> {
  const problem = dropBar(input)
  if (problem) throw new Error(problem)
  const res = await fetch('/api/drops', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(input),
  })
  const data = (await res.json()) as { error?: string; drop?: DeskDrop }
  if (!res.ok || !data.drop) throw new Error(data.error || 'The desk did not press this collection.')
  return data.drop
}
