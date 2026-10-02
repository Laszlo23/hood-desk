import { pushNightRun } from './nightDesk'

const KEY = 'hood-desk:night-board:v1'

export type BoardRow = {
  id: string
  address: string | null
  total: number
  best: number
  at: string
}

function cleanAddress(raw: string | null | undefined): string | null {
  const value = String(raw || '').trim()
  if (!/^0x[a-fA-F0-9]{40}$/.test(value)) return null
  return value.toLowerCase()
}

function read(): BoardRow[] {
  try {
    const raw = localStorage.getItem(KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw) as BoardRow[]
    if (!Array.isArray(parsed)) return []
    return parsed.filter((row) => row && typeof row.id === 'string' && Number(row.total) >= 0)
  } catch {
    return []
  }
}

function write(rows: BoardRow[]) {
  localStorage.setItem(KEY, JSON.stringify(rows.slice(0, 24)))
}

export function readBoard(): BoardRow[] {
  return read().sort((a, b) => b.total - a.total || b.best - a.best)
}

export function bestOf(best: Partial<Record<string, number>>): number {
  let max = 0
  for (const score of Object.values(best)) {
    if (typeof score === 'number' && score > max) max = score
  }
  return max
}

/** Remember a profile's night score. A connected wallet claims the local row. */
export function publishNightScore(
  address: string | null,
  total: number,
  best: number,
  claimLocal = false,
): BoardRow[] {
  const night = Math.max(0, Math.floor(total) || 0)
  const run = Math.max(0, Math.floor(best) || 0)
  if (night <= 0 && run <= 0) return readBoard()
  const wallet = cleanAddress(address)
  const id = wallet ?? 'local'
  const rows = read().filter((row) => row.id !== id && !(claimLocal && wallet && row.id === 'local'))
  const prev = read().find((row) => row.id === id)
  rows.push({
    id,
    address: wallet,
    total: Math.max(night, prev?.total ?? 0),
    best: Math.max(run, prev?.best ?? 0),
    at: new Date().toISOString(),
  })
  const ranked = rows.sort((a, b) => b.total - a.total || b.best - a.best)
  write(ranked)
  void pushNightRun({ address: wallet, total: night, best: run, score: 0 })
  return ranked
}

export function placeOnBoard(address: string | null): { place: number; total: number; of: number } | null {
  const rows = readBoard()
  if (rows.length === 0) return null
  const wallet = cleanAddress(address)
  const id = wallet ?? 'local'
  const index = rows.findIndex((row) => row.id === id)
  if (index < 0) return null
  return { place: index + 1, total: rows[index]?.total ?? 0, of: rows.length }
}
