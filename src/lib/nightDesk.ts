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
  recipient?: string | null
  neighbor?: string | null
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
        recipient: input.recipient ?? null,
        neighbor: input.neighbor ?? null,
      }),
    })
    if (!res.ok) {
      const body = await res.json().catch(() => ({}))
      if (body.error) {
        throw new Error(body.error)
      }
      return null
    }
    const data = asDesk(await res.json())
    if (!data) return null
    emit(data)
    return data
  } catch (err) {
    if (err instanceof Error) throw err
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

export function nightSharePost(input: {
  phase: 'title' | 'play' | 'caught' | 'home'
  score: number
  streak: number
  record: boolean
  carried: number
  pot: number | null
  url: string
}): string {
  const potBit =
    input.pot != null ? ` This week's pot is ${input.pot.toLocaleString('en-US')}.` : ' The wood is open.'
  const link = `Come take a run: ${input.url}`
  switch (input.phase) {
    case 'home': {
      if (input.score <= 0) return `The light found me. This run kept nothing.${potBit}\n\n${link}`
      const streakBit = input.streak > 0 ? ` Streak ${input.streak}.` : ''
      const bestBit = input.record ? ' New best.' : ''
      const tomorrow = input.streak > 0 ? ' Tomorrow it pays more.' : ''
      return `I stayed dark and came home with ${input.score.toLocaleString('en-US')}.${streakBit}${bestBit}${tomorrow}${potBit}\n\n${link}`
    }
    case 'caught':
      return `The light found me. This run kept nothing.${potBit}\n\n${link}`
    case 'title':
    case 'play': {
      if (input.carried > 0) {
        const streakBit = input.streak > 0 ? ` Streak ${input.streak}.` : ''
        return `The wood has ${input.carried.toLocaleString('en-US')} on my card.${streakBit}${potBit}\n\n${link}`
      }
      return `Stay dark. Take what the rich left in the light.${potBit}\n\n${link}`
    }
    default: {
      const unseen: never = input.phase
      return unseen
    }
  }
}

export function nightShareHref(text: string) {
  return `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}`
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
