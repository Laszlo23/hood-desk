import { useEffect, useState, type FormEvent } from 'react'
import { useAccount } from 'wagmi'
import { awardXp } from '../lib/gamification'
import {
  fetchBook,
  readSavedSeat,
  signBook,
  type BookChannel,
  type BookRoll,
  type SavedSeat,
} from '../lib/book'

const CHANNELS: { id: BookChannel; label: string; hint: string }[] = [
  { id: 'x', label: 'X', hint: '@name' },
  { id: 'farcaster', label: 'Farcaster', hint: 'username' },
  { id: 'email', label: 'Email', hint: 'you@domain' },
]

function channelWord(channel: BookChannel): string {
  switch (channel) {
    case 'x':
      return 'X'
    case 'farcaster':
      return 'Farcaster'
    case 'email':
      return 'email'
    default: {
      const neverChannel: never = channel
      return neverChannel
    }
  }
}

export function SignTheBook() {
  const { address } = useAccount()
  const [roll, setRoll] = useState<BookRoll | null>(null)
  const [saved, setSaved] = useState<SavedSeat | null>(() => readSavedSeat())
  const [channel, setChannel] = useState<BookChannel>(saved?.channel ?? 'x')
  const [name, setName] = useState(saved?.name ?? '')
  const [reach, setReach] = useState('')
  const [busy, setBusy] = useState(false)
  const [note, setNote] = useState<string | null>(null)

  useEffect(() => {
    let live = true
    fetchBook().then((next) => {
      if (live && next) setRoll(next)
    })
    return () => {
      live = false
    }
  }, [])

  async function onSubmit(event: FormEvent) {
    event.preventDefault()
    if (busy) return
    setBusy(true)
    setNote(null)
    const result = await signBook({ name, channel, reach, wallet: address })
    setBusy(false)
    if ('error' in result) {
      setNote(result.error)
      return
    }
    const awarded = awardXp('sign_book', { once: true })
    setRoll(result.roll)
    setSaved({ name: result.seat.name, channel: result.seat.channel })
    setReach('')
    setNote(
      awarded.awarded > 0
        ? `You're in. ${awarded.awarded} desk points landed on the card. The next note uses your ${channelWord(channel)}.`
        : `You're in. The next note uses your ${channelWord(channel)}.`,
    )
  }

  const hint = CHANNELS.find((item) => item.id === channel)?.hint ?? ''

  return (
    <div className="book-sign">
      <div className="book-sign-copy">
        <p className="eyebrow">The book</p>
        <h3>Write your name in</h3>
        <p>
          Leave one way back. The next note from this desk can find you. Your name stays on the page.
          The way back stays with the desk.
        </p>
      </div>

      <p className="book-count">
        {roll == null
          ? 'Opening the page…'
          : roll.count === 0
            ? 'The page is open. The first name starts it.'
            : `${roll.count.toLocaleString('en-US')} ${roll.count === 1 ? 'name' : 'names'} in the book.`}
      </p>

      {roll && roll.seats.length > 0 ? (
        <ul className="book-roll" aria-label="Names in the book">
          {roll.seats.map((seat) => (
            <li key={`${seat.channel}:${seat.name}:${seat.mark ?? ''}`}>
              <strong>{seat.name}</strong>
              {seat.mark ? <span>{seat.mark}</span> : null}
            </li>
          ))}
        </ul>
      ) : null}

      <form className="book-form" onSubmit={onSubmit}>
        <label className="field">
          <span>Name on the page</span>
          <input
            className="input"
            value={name}
            maxLength={32}
            autoComplete="nickname"
            onChange={(event) => setName(event.target.value)}
          />
        </label>
        <div className="book-channels" role="group" aria-label="Way back">
          {CHANNELS.map((item) => (
            <button
              key={item.id}
              type="button"
              className={`book-channel${channel === item.id ? ' is-on' : ''}`}
              aria-pressed={channel === item.id}
              onClick={() => setChannel(item.id)}
            >
              {item.label}
            </button>
          ))}
        </div>
        <label className="field">
          <span>Way back</span>
          <input
            className="input"
            value={reach}
            maxLength={120}
            placeholder={hint}
            autoComplete={channel === 'email' ? 'email' : 'off'}
            inputMode={channel === 'email' ? 'email' : 'text'}
            onChange={(event) => setReach(event.target.value)}
          />
        </label>
        <button type="submit" className="btn btn-primary" disabled={busy}>
          {busy ? 'Writing…' : saved ? 'Update the way back' : 'Write me in'}
        </button>
      </form>
      {note ? <p className="book-note">{note}</p> : null}
      {saved && !note ? (
        <p className="book-note">
          {saved.name} is in the book. The way back is {channelWord(saved.channel)}.
        </p>
      ) : null}
    </div>
  )
}
