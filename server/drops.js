import fs from 'fs'
import path from 'path'

const CAP = 60
const PALETTES = new Set(['night', 'amber', 'ice'])

function blank() {
  return { drops: [] }
}

function load(file) {
  try {
    const parsed = JSON.parse(fs.readFileSync(file, 'utf8'))
    if (!parsed || !Array.isArray(parsed.drops)) return blank()
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

function maker(raw) {
  const value = String(raw || '').trim().toLowerCase()
  if (/^0x[a-f0-9]{40}$/.test(value)) return value
  if (/^[a-f0-9]{16}$/.test(value)) return `desk:${value}`
  return null
}

function emptyPitch(value) {
  return /\b(guaranteed (profit|return|gains)|100x|floor (goes|will)|send (me |us )?eth|seed phrase|private key)\b/i.test(
    value,
  )
}

export function createDrops(file) {
  function snapshot() {
    const data = load(file)
    return { drops: data.drops.slice(0, 24) }
  }

  function submit(body) {
    const name = text(body.name, 32)
    const line = text(body.line, 280)
    const forWhom = text(body.forWhom, 160)
    const palette = String(body.palette || '')
    const seed = String(body.seed || '').trim().toLowerCase()
    const supply = Number(body.supply)
    const who = maker(body.maker)
    if (name.length < 2) return { error: 'Give the collection a name.' }
    if (line.length < 40) return { error: 'Say what the collection is, in a sentence or two.' }
    if (forWhom.length < 16) return { error: 'Say who it is for.' }
    if (!PALETTES.has(palette)) return { error: 'Pick a palette the desk knows.' }
    if (!/^[a-f0-9]{8}$/.test(seed)) return { error: 'The picture seed has to be 8 hex characters.' }
    if (!Number.isInteger(supply) || supply < 24 || supply > 144) {
      return { error: 'An edition is 24, 48, 96, or 144. One size, then it stops.' }
    }
    if (body.pledge !== true) {
      return { error: 'A drop agrees to one edition, no second mint, and no promise the price goes up.' }
    }
    const pitch = `${name} ${line} ${forWhom}`
    if (emptyPitch(pitch)) {
      return { error: 'A promise of profit, a key, or a payment request is not a drop.' }
    }

    const data = load(file)
    const same = data.drops.find(
      (row) =>
        row.name.toLowerCase() === name.toLowerCase() &&
        row.maker &&
        who &&
        row.maker === who,
    )
    if (same) return { error: 'You already pressed a collection with this name.' }

    const row = {
      id: `d_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`,
      at: new Date().toISOString(),
      name,
      line,
      forWhom,
      palette,
      seed,
      supply,
      maker: who,
    }
    data.drops.unshift(row)
    data.drops = data.drops.slice(0, CAP)
    save(file, data)
    return { drop: row, drops: data.drops.slice(0, 24) }
  }

  return { snapshot, submit }
}
