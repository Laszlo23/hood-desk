import { deskDate, LEVELS, type LevelId } from './stayDark'

const KEY = 'hood-desk:night-marks:v1'

export type NightMark = {
  id: string
  levelId: LevelId
  name: string
  line: string
  score: number
  earnedOn: string
  kind: 'level' | 'daily'
}

export type NightSave = {
  marks: NightMark[]
  best: Partial<Record<string, number>>
  total: number
  streak: number
  streakOn: string | null
}

function empty(): NightSave {
  return { marks: [], best: {}, total: 0, streak: 0, streakOn: null }
}

export function readNightSave(): NightSave {
  try {
    const raw = localStorage.getItem(KEY)
    if (!raw) return empty()
    const parsed = JSON.parse(raw) as NightSave
    return {
      marks: Array.isArray(parsed.marks) ? parsed.marks : [],
      best: parsed.best ?? {},
      total: Number(parsed.total) || 0,
      streak: Number(parsed.streak) || 0,
      streakOn: typeof parsed.streakOn === 'string' ? parsed.streakOn : null,
    }
  } catch {
    return empty()
  }
}

function write(save: NightSave) {
  localStorage.setItem(KEY, JSON.stringify(save))
}

export function markIdFor(levelId: LevelId): string {
  if (levelId === 'daily') return `daily:${deskDate()}`
  return `level:${levelId}`
}

export function noteNightHome(): { days: number; grew: boolean } {
  const save = readNightSave()
  const today = deskDate()
  if (save.streakOn === today) return { days: Math.max(1, save.streak), grew: false }
  let days = 1
  if (save.streakOn) {
    const previous = Date.parse(`${save.streakOn}T12:00:00Z`)
    const current = Date.parse(`${today}T12:00:00Z`)
    const gap = Math.round((current - previous) / 86_400_000)
    days = gap === 1 ? Math.max(1, save.streak) + 1 : 1
  }
  save.streak = days
  save.streakOn = today
  write(save)
  return { days, grew: true }
}

/** Extra points for coming back on a new day. The first day opens the streak. */
export function streakPay(days: number, grew: boolean) {
  if (!grew || days < 2) return 0
  return Math.min(days, 7) * 40
}

export function grantNightRun(levelId: LevelId, score: number): {
  save: NightSave
  mark: NightMark
  fresh: boolean
  best: number
  record: boolean
} {
  const save = readNightSave()
  const meta = LEVELS.find((level) => level.id === levelId) ?? LEVELS[0]
  const id = markIdFor(levelId)
  const earnedOn = deskDate()
  const kind = levelId === 'daily' ? 'daily' : 'level'
  const previous = save.best[id] ?? 0
  const best = Math.max(previous, score)
  save.best[id] = best
  save.total += score
  const existing = save.marks.find((mark) => mark.id === id)
  let fresh = false
  let mark: NightMark
  if (existing) {
    existing.score = best
    mark = existing
  } else {
    fresh = true
    mark = {
      id,
      levelId,
      name: meta.markName,
      line: meta.markLine,
      score: best,
      earnedOn,
      kind,
    }
    save.marks.push(mark)
  }
  write(save)
  return { save, mark, fresh, best, record: score > previous }
}

export function nextLevelId(id: LevelId): LevelId | null {
  if (id === 'gate') return 'hall'
  if (id === 'hall') return 'inner'
  return null
}
