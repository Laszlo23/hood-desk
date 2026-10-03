import fs from 'fs'
import path from 'path'

const RUN_CAP = 50_000
const TOTAL_CAP = 5_000_000
const BOARD_CAP = 40

function viennaDate(date = new Date()) {
  try {
    return new Intl.DateTimeFormat('en-CA', {
      timeZone: 'Europe/Vienna',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    }).format(date)
  } catch {
    return date.toISOString().slice(0, 10)
  }
}

function weekKey(date = new Date()) {
  const day = viennaDate(date)
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
  const week = data.weeks[key] || { pot: 0, best: 0, holder: null, runs: 0, tips: [], digs: [] }
  const tips = week.tips || []
  const digs = week.digs || []
  
  const recentMoves = []
  
  tips.slice(-20).forEach((tip) => {
    recentMoves.push({
      type: 'tip',
      from: tip.from,
      to: tip.to,
      amount: tip.amount,
      at: tip.at,
    })
  })
  
  digs.slice(-20).forEach((dig) => {
    recentMoves.push({
      type: 'dig',
      starter: dig.starter,
      neighbor: dig.neighbor,
      amount: dig.amount,
      at: dig.at,
    })
  })
  
  recentMoves.sort((a, b) => new Date(b.at).getTime() - new Date(a.at).getTime())
  
  return {
    week: key,
    pot: week.pot || 0,
    best: week.best || 0,
    holder: week.holder || null,
    runs: week.runs || 0,
    tips: tips.length,
    digs: digs.length,
    label: key.replace('-W', ' · week '),
    moves: recentMoves.slice(0, 30),
  }
}

function personalStats(data, address) {
  if (!address) return null
  
  const key = weekKey()
  const week = data.weeks[key] || { pot: 0, best: 0, holder: null, runs: 0, seen: [], tips: [], digs: [] }
  const tips = week.tips || []
  const digs = week.digs || []
  
  const row = data.rows.find((r) => r.address === address)
  const total = row?.total ?? 0
  const best = row?.best ?? 0
  
  const tipsGiven = tips.filter((t) => t.from === address).length
  const tipsReceived = tips.filter((t) => t.to === address).length
  const digsCount = digs.filter((d) => d.starter === address || d.neighbor === address).length
  
  return {
    address,
    total,
    best,
    tipsGiven,
    tipsReceived,
    digs: digsCount,
  }
}

export function createNightDesk(file) {
  function read() {
    return load(file)
  }

  function snapshot(address = null) {
    const data = read()
    const result = { board: ranked(data.rows), jackpot: publicWeek(data, weekKey()) }
    if (address) {
      result.personal = personalStats(data, address)
    }
    return result
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
    const week = data.weeks[key] || { pot: 0, best: 0, holder: null, runs: 0, seen: [], tips: [], digs: [], lastCheckInDay: null }
    const runId = cleanRun(body?.runId)
    const recipient = cleanAddress(body?.recipient)
    const neighbor = cleanAddress(body?.neighbor)
    
    let earlyBirdBonus = 0

    if (runId && !week.seen.includes(runId)) {
      week.seen = [...week.seen, runId].slice(-400)
      
      if (recipient && runId.startsWith('tip:') && score > 0) {
        const recipientRow = data.rows.find((row) => row.address === recipient)
        if (recipientRow) {
          recipientRow.total = Math.max(0, (recipientRow.total || 0) + score)
          recipientRow.at = new Date().toISOString()
          data.rows = ranked(data.rows)
          
          week.tips = week.tips || []
          week.tips.push({
            from: address,
            to: recipient,
            amount: score,
            runId,
            at: new Date().toISOString(),
          })
          week.tips = week.tips.slice(-200)
        }
      }
      
      if (neighbor && runId.startsWith('dig:') && address && neighbor !== address) {
        week.digs = week.digs || []
        const today = viennaDate()
        const alreadyDug = week.digs.some((dig) => {
          const digDay = viennaDate(new Date(dig.at))
          if (digDay !== today) return false
          return (
            (dig.starter === address && dig.neighbor === neighbor) ||
            (dig.starter === neighbor && dig.neighbor === address)
          )
        })
        
        if (alreadyDug) {
          return { error: 'You already dug with this neighbor today.' }
        }
        
        const digYield = 30
        const digCost = digYield * 2
        if (week.pot < digCost) {
          return { error: 'The pot cannot afford a dig right now.' }
        }
        
        const neighborRow = data.rows.find((row) => row.address === neighbor)
        if (!neighborRow) {
          return { error: 'Neighbor not found on the board.' }
        }
        
        week.pot -= digCost
        
        next.total += digYield
        neighborRow.total += digYield
        neighborRow.at = new Date().toISOString()
        
        data.rows = ranked([...data.rows.filter((row) => row.id !== id), next])
        
        week.digs.push({
          starter: address,
          neighbor,
          amount: digYield,
          runId,
          at: new Date().toISOString(),
        })
        week.digs = week.digs.slice(-200)
      }
      
      if (score > 0 && runId.startsWith('homecoming:')) {
        const today = viennaDate()
        
        if (week.lastCheckInDay !== today) {
          earlyBirdBonus = 20
          next.total += earlyBirdBonus
          week.lastCheckInDay = today
        }
        
        week.pot += score
        week.runs += 1
        if (score >= week.best) {
          week.best = score
          week.holder = address
        }
      }
    }
    data.weeks[key] = week
    data.rows = ranked([...data.rows.filter((row) => row.id !== id), next])
    save(file, data)
    const result = { board: ranked(data.rows), jackpot: publicWeek(data, key) }
    if (address) {
      result.personal = personalStats(data, address)
    }
    if (earlyBirdBonus > 0) {
      result.earlyBird = true
    }
    return result
  }

  return { snapshot, submit }
}
