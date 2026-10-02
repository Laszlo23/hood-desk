import fs from 'fs'
import path from 'path'

const RUN_CAP = 50_000
const TOTAL_CAP = 5_000_000
const BOARD_CAP = 40

function weekKey(date = new Date()) {
  let day = ''
  try {
    day = new Intl.DateTimeFormat('en-CA', {
      timeZone: 'Europe/Vienna',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    }).format(date)
  } catch {
    day = date.toISOString().slice(0, 10)
  }
  const noon = new Date(`${day}T12:00:00Z`)
  const utc = new Date(Date.UTC(noon.getUTCFullYear(), noon.getUTCMonth(), noon.getUTCDate()))
  const weekday = utc.getUTCDay() || 7
  utc.setUTCDate(utc.getUTCDate() + 4 - weekday)
  const yearStart = new Date(Date.UTC(utc.getUTCFullYear(), 0, 1))
  const week = Math.ceil(((utc.getTime() - yearStart.getTime()) / 86400000 + 1) / 7)
  return `${utc.getUTCFullYear()}-W${String(week).padStart(2, '0')}`
}

function blank() {
  return { rows: [], weeks: {} }
}

function load(file) {
  try {
    const parsed = JSON.parse(fs.readFileSync(file, 'utf8'))
    if (!parsed || !Array.isArray(parsed.rows) || typeof parsed.weeks !== 'object') return blank()
    return parsed
  } catch {
    return blank()
  }
}

function save(file, data) {
  fs.mkdirSync(path.dirname(file), { recursive: true })
  fs.writeFileSync(file, JSON.stringify(data))
}

function cleanAddress(raw) {
  const value = String(raw || '').trim().toLowerCase()
  return /^0x[a-f0-9]{40}$/.test(value) ? value : null
}

function cleanDesk(raw) {
  const value = String(raw || '').trim().toLowerCase()
  return /^[a-f0-9]{16}$/.test(value) ? value : null
}

function cleanRun(raw) {
  const value = String(raw || '').trim()
  return /^[a-z0-9:_-]{4,80}$/.test(value) ? value : null
}

function whole(raw, max) {
  const n = Math.floor(Number(raw))
  if (!Number.isFinite(n) || n < 0 || n > max) return null
  return n
}

function ranked(rows) {
  return rows
    .filter((row) => row && typeof row.id === 'string')
    .sort((a, b) => b.total - a.total || b.best - a.best)
    .slice(0, BOARD_CAP)
}

function publicWeek(data, key) {
  const week = data.weeks[key] || { pot: 0, best: 0, holder: null, runs: 0 }
  return {
    week: key,
    pot: week.pot || 0,
    best: week.best || 0,
    holder: week.holder || null,
    runs: week.runs || 0,
    label: key.replace('-W', ' · week '),
  }
}

export function createNightDesk(file) {
  function read() {
    return load(file)
  }

  function snapshot() {
    const data = read()
    return { board: ranked(data.rows), jackpot: publicWeek(data, weekKey()) }
  }

  function submit(body) {
    const address = cleanAddress(body?.address)
    const desk = cleanDesk(body?.desk)
    if (!address && !desk) return { error: 'A wallet or a desk id is required.' }
    const total = whole(body?.total, TOTAL_CAP)
    const best = whole(body?.best, RUN_CAP)
    const score = whole(body?.score ?? 0, RUN_CAP)
    if (total === null || best === null || score === null) return { error: 'That score is not a desk number.' }
    if (total <= 0 && best <= 0 && score <= 0) return snapshot()

    const data = read()
    const id = address || `desk:${desk}`
    const prev = data.rows.find((row) => row.id === id)
    const next = {
      id,
      address,
      total: Math.max(total, prev?.total ?? 0),
      best: Math.max(best, score, prev?.best ?? 0),
      at: new Date().toISOString(),
    }
    data.rows = ranked([...data.rows.filter((row) => row.id !== id), next])

    const key = weekKey()
    const week = data.weeks[key] || { pot: 0, best: 0, holder: null, runs: 0, seen: [] }
    const runId = cleanRun(body?.runId)
    if (score > 0 && runId && !week.seen.includes(runId)) {
      week.seen = [...week.seen, runId].slice(-400)
      week.pot += score
      week.runs += 1
      if (score >= week.best) {
        week.best = score
        week.holder = address
      }
    }
    data.weeks[key] = week
    save(file, data)
    return { board: ranked(data.rows), jackpot: publicWeek(data, key) }
  }

  return { snapshot, submit }
}
