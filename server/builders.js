import fs from 'fs'
import path from 'path'

const CAP = 80

function blank() {
  return { projects: [] }
}

function load(file) {
  try {
    const parsed = JSON.parse(fs.readFileSync(file, 'utf8'))
    if (!parsed || !Array.isArray(parsed.projects)) return blank()
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

function link(raw) {
  const value = text(raw, 200)
  try {
    const url = new URL(value)
    if (url.protocol !== 'https:' && url.protocol !== 'http:') return null
    return url.toString()
  } catch {
    return null
  }
}

function maker(raw) {
  const value = String(raw || '').trim().toLowerCase()
  if (/^0x[a-f0-9]{40}$/.test(value)) return value
  if (/^[a-f0-9]{16}$/.test(value)) return `desk:${value}`
  return null
}

function emptyPitch(value) {
  return /\b(guaranteed (profit|return|gains)|100x|send (me |us )?eth|seed phrase|private key)\b/i.test(
    value,
  )
}

export function createBuilders(file) {
  function snapshot() {
    const data = load(file)
    return {
      projects: data.projects.slice(0, 40),
    }
  }

  function submit(body) {
    const name = text(body.name, 48)
    const work = text(body.work, 600)
    const forWhom = text(body.forWhom, 200)
    const href = link(body.link)
    const who = maker(body.maker)
    if (name.length < 2) return { error: 'Give the project a name.' }
    if (work.length < 80) {
      return { error: 'Say what you built, in at least a few sentences. A ticker is not a project.' }
    }
    if (forWhom.length < 20) return { error: 'Say who this is for.' }
    if (!href) return { error: 'Add a real http or https link to the work.' }
    if (body.pledge !== true) {
      return { error: 'A listed project agrees to one mint, no tax, and no promise of profit.' }
    }
    const pitch = `${name} ${work} ${forWhom}`
    if (emptyPitch(pitch)) {
      return { error: 'A promise of profit, a key, or a payment request is not listed.' }
    }

    const data = load(file)
    const same = data.projects.find(
      (row) =>
        row.name.toLowerCase() === name.toLowerCase() &&
        row.maker &&
        who &&
        row.maker === who,
    )
    if (same) return { error: 'You already listed a project with this name.' }

    const row = {
      id: `b_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`,
      at: new Date().toISOString(),
      name,
      work,
      forWhom,
      link: href,
      maker: who,
    }
    data.projects.unshift(row)
    data.projects = data.projects.slice(0, CAP)
    save(file, data)
    return { project: row, projects: data.projects.slice(0, 40) }
  }

  return { snapshot, submit }
}
