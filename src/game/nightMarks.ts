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
}

function empty(): NightSave {
  return { marks: [], best: {}, total: 0 }
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

export function grantNightRun(levelId: LevelId, score: number): {
  save: NightSave
  mark: NightMark
  fresh: boolean
  best: number
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
  return { save, mark, fresh, best }
}

export function nextLevelId(id: LevelId): LevelId | null {
  if (id === 'gate') return 'hall'
  if (id === 'hall') return 'inner'
  return null
}
