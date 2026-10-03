import fs from 'fs'
import path from 'path'

const CAP = 500

function blank() {
  return { seats: [] }
}

function load(file) {
  try {
    const parsed = JSON.parse(fs.readFileSync(file, 'utf8'))
    if (!parsed || !Array.isArray(parsed.seats)) return blank()
    return parsed
  } catch {
    return blank()
  }
}

function save(file, data) {
  fs.mkdirSync(path.dirname(file), { recursive: true })
  fs.writeFileSync(file, JSON.stringify(data))
}

function text(raw, max) {
  return String(raw || '')
    .replace(/[\u0000-\u001f]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, max)
}

function publicSeat(seat) {
  return {
    name: seat.name,
    channel: seat.channel,
    mark: seat.channel === 'email' ? null : seat.mark,
  }
}

function reachOf(channel, raw) {
  if (channel === 'email') {
    const value = text(raw, 120).toLowerCase()
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) return null
    return { reach: value, mark: null }
  }
  if (channel === 'x') {
    const value = text(raw, 20).replace(/^@/, '')
    if (!/^[A-Za-z0-9_]{1,15}$/.test(value)) return null
    return { reach: `x:${value.toLowerCase()}`, mark: `@${value}` }
  }
  if (channel === 'farcaster') {
    const value = text(raw, 32).replace(/^@/, '')
    if (!/^[A-Za-z0-9][A-Za-z0-9-]{0,15}$/.test(value)) return null
    return { reach: `fc:${value.toLowerCase()}`, mark: `@${value}` }
  }
  return null
}

export function createBook(file) {
  function snapshot() {
    const data = load(file)
    const seats = data.seats.slice(0, 24).map(publicSeat)
    return { count: data.seats.length, seats }
  }

  function submit(body) {
    const name = text(body.name, 32)
    const channel = text(body.channel, 12)
    const way = reachOf(channel, body.reach)
    const desk = text(body.desk, 24)
    const wallet = text(body.wallet, 42).toLowerCase()
    if (name.length < 2) return { error: 'Write the name you want on the page.' }
    if (/https?:|@/.test(name)) return { error: 'The name on the page is a name, not a link.' }
    if (!way) {
      if (channel === 'email') return { error: 'That email does not look complete.' }
      if (channel === 'x') return { error: 'An X name is letters, numbers, and underscores.' }
      if (channel === 'farcaster') return { error: 'A Farcaster name is letters, numbers, and hyphens.' }
      return { error: 'Pick X, Farcaster, or email.' }
    }
    if (desk && !/^desk:[a-f0-9]{16}$/.test(desk)) return { error: 'The desk id is not valid.' }
    if (wallet && !/^0x[a-f0-9]{40}$/.test(wallet)) return { error: 'That wallet address is not valid.' }

    const data = load(file)
    const taken = data.seats.find((seat) => seat.reach === way.reach)
    const mine = desk ? data.seats.find((seat) => seat.desk === desk) : null
    if (taken && taken !== mine) return { error: 'That way back is already in the book.' }

    const seat = {
      name,
      channel,
      reach: way.reach,
      mark: way.mark,
      desk: desk || null,
      wallet: wallet || null,
      at: new Date().toISOString(),
    }
    if (mine) {
      Object.assign(mine, seat)
    } else {
      data.seats.unshift(seat)
      data.seats = data.seats.slice(0, CAP)
    }
    save(file, data)
    return { count: data.seats.length, seat: publicSeat(seat), seats: data.seats.slice(0, 24).map(publicSeat) }
  }

  return { snapshot, submit }
}
