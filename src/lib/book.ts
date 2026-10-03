import { deskId } from './nightDesk'

export type BookChannel = 'x' | 'farcaster' | 'email'

export type BookSeat = {
  name: string
  channel: BookChannel
  mark: string | null
}

export type BookRoll = {
  count: number
  seats: BookSeat[]
}

const SEAT_KEY = 'hood-desk:book-seat:v1'

export type SavedSeat = {
  name: string
  channel: BookChannel
}

function isChannel(value: string): value is BookChannel {
  return value === 'x' || value === 'farcaster' || value === 'email'
}

export function readSavedSeat(): SavedSeat | null {
  try {
    const raw = localStorage.getItem(SEAT_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw) as SavedSeat
    if (!parsed?.name || !isChannel(parsed.channel)) return null
    return { name: parsed.name, channel: parsed.channel }
  } catch {
    return null
  }
}

export function rememberSeat(seat: SavedSeat): void {
  localStorage.setItem(SEAT_KEY, JSON.stringify(seat))
}

export async function fetchBook(): Promise<BookRoll | null> {
  try {
    const res = await fetch('/api/book')
    if (!res.ok) return null
    const body = (await res.json()) as BookRoll
    if (!Array.isArray(body.seats)) return null
    return { count: body.count, seats: body.seats }
  } catch {
    return null
  }
}

export async function signBook(input: {
  name: string
  channel: BookChannel
  reach: string
  wallet?: string | null
}): Promise<{ roll: BookRoll; seat: BookSeat } | { error: string }> {
  try {
    const res = await fetch('/api/book', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: input.name,
        channel: input.channel,
        reach: input.reach,
        desk: `desk:${deskId()}`,
        wallet: input.wallet || undefined,
      }),
    })
    const body = (await res.json().catch(() => ({}))) as {
      error?: string
      count?: number
      seats?: BookSeat[]
      seat?: BookSeat
    }
    if (!res.ok || !body.seat || !body.seats) {
      return { error: body.error || 'The book did not take the name.' }
    }
    rememberSeat({ name: body.seat.name, channel: body.seat.channel })
    return { roll: { count: body.count ?? body.seats.length, seats: body.seats }, seat: body.seat }
  } catch {
    return { error: 'The book is not answering. Try again in a moment.' }
  }
}
