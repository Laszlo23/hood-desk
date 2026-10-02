import type { BoardRow } from './nightBoard'

const DESK_KEY = 'hood-desk:desk-id:v1'

export type Jackpot = {
  week: string
  pot: number
  best: number
  holder: string | null
  runs: number
  label: string
}

export type NightDesk = {
  board: BoardRow[]
  jackpot: Jackpot
}

const listeners = new Set<() => void>()
let cache: { at: number; data: NightDesk } | null = null

export function onNightDesk(listen: () => void) {
  listeners.add(listen)
  return () => listeners.delete(listen)
}

function emit(data: NightDesk) {
  cache = { at: Date.now(), data }
  for (const listen of listeners) listen()
}

export function deskId(): string {
  try {
    const existing = localStorage.getItem(DESK_KEY)
    if (existing && /^[a-f0-9]{16}$/.test(existing)) return existing
    const bytes = new Uint8Array(8)
    crypto.getRandomValues(bytes)
    const next = [...bytes].map((byte) => byte.toString(16).padStart(2, '0')).join('')
    localStorage.setItem(DESK_KEY, next)
    return next
  } catch {
    return '0000000000000000'
  }
}

function asDesk(raw: unknown): NightDesk | null {
  if (!raw || typeof raw !== 'object') return null
  const body = raw as { board?: BoardRow[]; jackpot?: Jackpot }
  if (!Array.isArray(body.board) || !body.jackpot || typeof body.jackpot.pot !== 'number') return null
  return { board: body.board, jackpot: body.jackpot }
}

export async function fetchNightDesk(force = false): Promise<NightDesk | null> {
  if (!force && cache && Date.now() - cache.at < 8000) return cache.data
  try {
    const res = await fetch('/api/night')
    if (!res.ok) return cache?.data ?? null
    const data = asDesk(await res.json())
    if (!data) return cache?.data ?? null
    emit(data)
    return data
  } catch {
    return cache?.data ?? null
  }
}

export async function pushNightRun(input: {
  address: string | null
  total: number
  best: number
  score?: number
  runId?: string
}): Promise<NightDesk | null> {
  try {
    const res = await fetch('/api/night', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        address: input.address,
        desk: deskId(),
        total: input.total,
        best: input.best,
        score: input.score ?? 0,
        runId: input.runId ?? '',
      }),
    })
    if (!res.ok) return null
    const data = asDesk(await res.json())
    if (!data) return null
    emit(data)
    return data
  } catch {
    return null
  }
}

export function placeOnDesk(board: BoardRow[], address: string | null): { place: number; of: number; total: number } | null {
  const wallet = address?.toLowerCase() ?? null
  const id = wallet || `desk:${deskId()}`
  const index = board.findIndex((row) => row.id === id || (wallet !== null && row.address === wallet))
  if (index < 0) return null
  return { place: index + 1, of: board.length, total: board[index]?.total ?? 0 }
}

export async function shareDeskLine(text: string): Promise<'shared' | 'copied' | 'closed'> {
  const url = `${window.location.origin}${window.location.pathname}#/dark`
  const full = `${text} ${url}`
  if (typeof navigator.share === 'function') {
    try {
      await navigator.share({ title: 'Stay dark', text, url })
      return 'shared'
    } catch {
      return 'closed'
    }
  }
  try {
    await navigator.clipboard.writeText(full)
    return 'copied'
  } catch {
    return 'closed'
  }
}
