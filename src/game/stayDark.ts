/** Pixel night run. The pack holds three. Stand still in the wood to keep what you chose. */

export const COLS = 24
export const ROWS = 16
export const TILE = 16

const WALL = 1
const RICH = 2
const WOOD = 3

export type Phase = 'title' | 'play' | 'caught' | 'home'

export type SkillName = 'quiet' | 'shadow' | 'lift'

type Torch = { x: number; y: number }
type Purse = {
  name: string
  x: number
  y: number
  points: number
  slots: number
  hidden: boolean
  taken: boolean
}
type Guard = {
  x: number
  y: number
  axis: 'x' | 'y'
  dir: number
  min: number
  max: number
  speed: number
  homeX: number
  homeY: number
  dir0: number
}
type Spark = { x: number; y: number; vx: number; vy: number; life: number; color: string }
type Floater = { x: number; y: number; text: string; life: number }
type Relic = {
  name: string
  x0: number
  y0: number
  x1: number
  y1: number
  x: number
  y: number
  open: number
  close: number
  points: number
  reach: number
  taken: boolean
  missed: boolean
  warned: boolean
  line: string
  warn: string
}

export type SkillHud = {
  active: number
  wait: number
}

export type LevelId = 'gate' | 'hall' | 'inner' | 'daily'

export type Hud = {
  phase: Phase
  heat: number
  purses: number
  need: number
  line: string
  score: number
  tally: number
  purseScore: number
  rareScore: number
  timeScore: number
  darkScore: number
  pop: string
  rareName: string
  rareLeft: number
  rareState: 'wait' | 'soon' | 'open' | 'kept' | 'gone'
  levelId: LevelId
  levelName: string
  markName: string
  quiet: SkillHud
  shadow: SkillHud
  lift: SkillHud
  kept: string
}

export type FrameInput = {
  x: number
  y: number
  quiet: boolean
  shadow: boolean
  lift: boolean
  start: boolean
  reducedMotion: boolean
  level: LevelId
}

type Skill = { left: number; cd: number }

export type Game = {
  tiles: number[]
  player: { x: number; y: number }
  torches: Torch[]
  purses: Purse[]
  relics: Relic[]
  guards: Guard[]
  riches: { x: number; y: number }[]
  home: { x: number; y: number }
  spawn: { x: number; y: number }
  phase: Phase
  heat: number
  peak: number
  quiet: Skill
  shadow: Skill
  liftCd: number
  line: string
  lineT: number
  sparks: Spark[]
  floaters: Floater[]
  chime: '' | 'gold' | 'rare' | 'home' | 'caught'
  moving: boolean
  time: number
  elapsed: number
  flash: number
  levelId: LevelId
  levelName: string
  markName: string
  need: number
  score: number
  tally: number
  purseScore: number
  rareScore: number
  timeScore: number
  darkScore: number
  pop: string
  popT: number
  homeHold: number
}

const QUIET_TIME = 4.2
const QUIET_CD = 7
const SHADOW_TIME = 3.2
const SHADOW_CD = 8
export const PACK = 3
const HOME_HOLD = 1.15

export function deskDate(): string {
  try {
    return new Intl.DateTimeFormat('en-CA', {
      timeZone: 'Europe/Vienna',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    }).format(new Date())
  } catch {
    return new Date().toISOString().slice(0, 10)
  }
}

type GuardSeed = Omit<Guard, 'homeX' | 'homeY' | 'dir0'>

const RICHES = [
  { x: 6.6, y: 2.4 },
  { x: 16.4, y: 2.4 },
  { x: 16.4, y: 12.6 },
]

const BASE_TORCHES = [
  { x: 4.5, y: 2.5 },
  { x: 18.5, y: 2.5 },
  { x: 18.5, y: 12.5 },
]

function hallGuard(speed: number, x = 6.5): GuardSeed {
  return { x, y: 7.5, axis: 'x', dir: 1, min: 2.5, max: 21.5, speed }
}

function spineGuard(speed: number): GuardSeed {
  return { x: 11.5, y: 4.5, axis: 'y', dir: 1, min: 1.5, max: 13.5, speed }
}

function laneGuard(speed: number): GuardSeed {
  return { x: 16.5, y: 8.5, axis: 'x', dir: -1, min: 3.5, max: 21.5, speed }
}

function tilesInner() {
  const tiles = buildTiles()
  for (let y = 1; y <= 4; y++) {
    for (let x = 10; x <= 12; x++) tiles[idx(x, y)] = RICH
  }
  return tiles
}

function dateSalt(date: string) {
  let hash = 0
  for (const ch of date) hash = (hash * 33 + ch.charCodeAt(0)) >>> 0
  return hash
}

export function moonWindowOpen(now = new Date()): boolean {
  try {
    const minute = Number(
      new Intl.DateTimeFormat('en-GB', {
        timeZone: 'Europe/Vienna',
        minute: 'numeric',
      }).format(now),
    )
    return minute % 10 < 2
  } catch {
    return now.getMinutes() % 10 < 2
  }
}

export const LEVELS: {
  id: LevelId
  name: string
  blurb: string
  markName: string
  markLine: string
}[] = [
  {
    id: 'gate',
    name: 'The gate',
    blurb: 'Robin leaves the wood. The first house still trusts its torches.',
    markName: 'Gate mark',
    markLine: 'The first light, left behind.',
  },
  {
    id: 'hall',
    name: 'The hall',
    blurb: 'Two walk the stone. Robin walks the dark beside them.',
    markName: 'Hall mark',
    markLine: 'The hall watched, and missed.',
  },
  {
    id: 'inner',
    name: 'The inner rooms',
    blurb: 'Deeper in, the gold sits closer to the flame.',
    markName: 'Inner mark',
    markLine: 'The inner rooms gave up the purses.',
  },
  {
    id: 'daily',
    name: 'Tonight',
    blurb: 'Tonight the house has shifted. The wood still knows the way.',
    markName: 'Tonight mark',
    markLine: 'This night is kept.',
  },
]

function idx(x: number, y: number) {
  return y * COLS + x
}

function buildTiles() {
  const tiles = new Array<number>(COLS * ROWS).fill(0)
  const fill = (x0: number, y0: number, x1: number, y1: number, v: number) => {
    for (let y = y0; y <= y1; y++) {
      for (let x = x0; x <= x1; x++) tiles[idx(x, y)] = v
    }
  }
  fill(0, 0, COLS - 1, 0, WALL)
  fill(0, ROWS - 1, COLS - 1, ROWS - 1, WALL)
  fill(0, 0, 0, ROWS - 1, WALL)
  fill(COLS - 1, 0, COLS - 1, ROWS - 1, WALL)
  fill(1, 6, 22, 6, WALL)
  fill(1, 9, 22, 9, WALL)
  fill(9, 1, 9, 5, WALL)
  fill(13, 1, 13, 5, WALL)
  fill(9, 10, 9, 14, WALL)
  fill(13, 10, 13, 14, WALL)
  fill(1, 1, 8, 5, RICH)
  fill(14, 1, 22, 5, RICH)
  fill(14, 10, 22, 14, RICH)
  fill(1, 10, 8, 14, WOOD)
  for (const [x, y] of [
    [3, 6],
    [4, 6],
    [5, 6],
    [17, 6],
    [18, 6],
    [19, 6],
    [3, 9],
    [4, 9],
    [5, 9],
    [17, 9],
    [18, 9],
    [19, 9],
    [11, 6],
    [11, 9],
  ] as const) {
    tiles[idx(x, y)] = 0
  }
  return tiles
}

function blankGame(): Game {
  return {
    tiles: buildTiles(),
    player: { x: 3.5, y: 13.5 },
    torches: [],
    purses: [],
    relics: [],
    guards: [],
    riches: RICHES,
    home: { x: 2.5, y: 12.5 },
    spawn: { x: 3.5, y: 13.5 },
    phase: 'title',
    heat: 0,
    peak: 0,
    quiet: { left: 0, cd: 0 },
    shadow: { left: 0, cd: 0 },
    liftCd: 0,
    line: 'The rich keep the light.',
    lineT: 99,
    sparks: [],
    floaters: [],
    chime: '',
    moving: false,
    time: 0,
    elapsed: 0,
    flash: 0,
    levelId: 'gate',
    levelName: 'The gate',
    markName: 'Gate mark',
    need: 3,
    score: 0,
    tally: 0,
    purseScore: 0,
    rareScore: 0,
    timeScore: 0,
    darkScore: 0,
    pop: '',
    popT: 0,
    homeHold: 0,
  }
}

function withHome(seed: GuardSeed): Guard {
  return { ...seed, homeX: seed.x, homeY: seed.y, dir0: seed.dir }
}

export function applyLevel(game: Game, id: LevelId) {
  const meta = LEVELS.find((level) => level.id === id) ?? LEVELS[0]
  const date = deskDate()
  const salt = dateSalt(date)
  game.levelId = meta.id
  game.levelName = meta.id === 'daily' ? `Tonight · ${date.slice(5)}` : meta.name
  game.markName = meta.markName
  game.home = { x: 2.5, y: 12.5 }
  game.spawn = { x: 3.5, y: 13.5 }
  game.riches = RICHES.slice()
  if (id === 'gate') {
    game.tiles = buildTiles()
    game.torches = BASE_TORCHES.map((torch) => ({ ...torch }))
    game.guards = [withHome(hallGuard(1.15, 8.5))]
  } else if (id === 'hall') {
    game.tiles = buildTiles()
    game.torches = BASE_TORCHES.map((torch) => ({ ...torch }))
    game.guards = [withHome(hallGuard(1.55)), withHome(spineGuard(1.5))]
  } else {
    game.tiles = tilesInner()
    game.torches = [...BASE_TORCHES.map((torch) => ({ ...torch })), { x: 11.5, y: 2.5 }]
    game.riches = [...RICHES, { x: 11.5, y: 4.4 }]
    const guards = [hallGuard(1.65, 5.5), spineGuard(1.7), laneGuard(1.75)]
    if (id === 'daily') {
      guards.forEach((guard, index) => {
        guard.dir = (salt >> index) & 1 ? 1 : -1
        if (guard.axis === 'x') {
          const span = guard.max - guard.min
          guard.x = guard.min + ((salt >> (index * 4)) % 97) / 97 * span
        } else {
          const span = guard.max - guard.min
          guard.y = guard.min + ((salt >> (index * 4)) % 97) / 97 * span
        }
      })
    }
    game.guards = guards.map(withHome)
  }
  game.need = PACK
  game.line = meta.blurb
  game.lineT = 99
  resetRun(game)
  game.phase = 'title'
}

export function createGame(level: LevelId = 'gate'): Game {
  const game = blankGame()
  applyLevel(game, level)
  return game
}

function tileAt(game: Game, x: number, y: number) {
  const c = Math.floor(x)
  const r = Math.floor(y)
  if (c < 0 || r < 0 || c >= COLS || r >= ROWS) return WALL
  return game.tiles[idx(c, r)]
}

function blocked(game: Game, x: number, y: number) {
  const r = 0.26
  return (
    tileAt(game, x - r, y - r) === WALL ||
    tileAt(game, x + r, y - r) === WALL ||
    tileAt(game, x - r, y + r) === WALL ||
    tileAt(game, x + r, y + r) === WALL
  )
}

function say(game: Game, line: string) {
  game.line = line
  game.lineT = 6.4
}

const TALE: Record<LevelId, { open: string; home: string }> = {
  gate: {
    open: 'Robin steps from the wood. The pack holds three. The rest stays behind.',
    home: 'The wood takes what he chose, and leaves the rest in the dark.',
  },
  hall: {
    open: 'Two keep the hall. The pack is small, so Robin chooses.',
    home: 'Robin is under the trees. The hall keeps what he left.',
  },
  inner: {
    open: 'The inner rooms hide gold in the dark. The pack still holds three.',
    home: 'The inner house never learned the name. The wood did.',
  },
  daily: {
    open: 'Tonight the gold is scattered. The pack still holds three.',
    home: 'Tonight is kept. The wood writes down what he carried.',
  },
}

function prettyLoot(name: string) {
  if (name === 'COIN') return 'a coin'
  if (name === 'PURSE') return 'a purse'
  if (name === 'RING') return 'a ring'
  if (name === 'CUP') return 'a cup'
  if (name === 'GEM') return 'a gem'
  if (name === 'MOON') return 'the moon gem'
  return 'something'
}

export function lightAt(game: Game, x: number, y: number, reduced: boolean) {
  let best = 0
  for (const torch of game.torches) {
    const flick = reduced ? 1 : 0.88 + 0.12 * Math.sin(game.time * 7 + torch.x * 3)
    const radius = 3.05 * flick
    const d = Math.hypot(x - torch.x, y - torch.y)
    if (d < radius) best = Math.max(best, (1 - d / radius) * flick)
  }
  return best
}

function sees(guard: Guard, x: number, y: number) {
  const dx = x - guard.x
  const dy = y - guard.y
  const ahead = guard.axis === 'x' ? dx * guard.dir : dy * guard.dir
  const side = guard.axis === 'x' ? Math.abs(dy) : Math.abs(dx)
  return ahead > 0.35 && ahead < 4.5 && side < 0.55
}

function clamp(n: number, a: number, b: number) {
  return Math.max(a, Math.min(b, n))
}

function packUsed(game: Game) {
  let used = 0
  for (const loot of game.purses) if (loot.taken) used += loot.slots
  return used
}

function lootShown(game: Game, loot: Purse) {
  if (loot.taken || !loot.hidden) return !loot.taken
  const near = Math.hypot(game.player.x - loot.x, game.player.y - loot.y) <= 2.4
  if (!near) return false
  const light = lightAt(game, loot.x, loot.y, true)
  return light < 0.35 || game.shadow.left > 0
}

function scatterLoot(game: Game) {
  let seed = (Date.now() ^ dateSalt(deskDate()) ^ game.levelId.length * 997) >>> 0
  const rand = () => {
    seed = (Math.imul(1664525, seed) + 1013904223) >>> 0
    return seed / 4294967296
  }
  const bag: { name: string; points: number; slots: number; hidden: boolean }[] = [
    { name: 'COIN', points: 90, slots: 1, hidden: true },
    { name: 'COIN', points: 110, slots: 1, hidden: true },
    { name: 'PURSE', points: 170, slots: 1, hidden: false },
    { name: 'PURSE', points: 190, slots: 1, hidden: true },
    { name: 'RING', points: 280, slots: 1, hidden: true },
    { name: 'CUP', points: 360, slots: 2, hidden: false },
    { name: 'GEM', points: 480, slots: 2, hidden: true },
  ]
  for (let i = bag.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1))
    const a = bag[i]
    const b = bag[j]
    if (a === undefined || b === undefined) continue
    bag[i] = b
    bag[j] = a
  }
  const count = game.levelId === 'inner' ? 7 : game.levelId === 'gate' ? 5 : 6
  const picks = bag.slice(0, count)
  if (moonWindowOpen()) picks.push({ name: 'MOON', points: 640, slots: 2, hidden: true })

  const spots: { x: number; y: number; light: number }[] = []
  for (let y = 1; y < ROWS - 1; y++) {
    for (let x = 1; x < COLS - 1; x++) {
      const tile = game.tiles[idx(x, y)]
      if (tile === WALL || tile === WOOD) continue
      const cx = x + 0.5
      const cy = y + 0.5
      if (Math.hypot(cx - game.spawn.x, cy - game.spawn.y) < 3) continue
      spots.push({ x: cx, y: cy, light: lightAt(game, cx, cy, true) })
    }
  }
  for (let i = spots.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1))
    const a = spots[i]
    const b = spots[j]
    if (a === undefined || b === undefined) continue
    spots[i] = b
    spots[j] = a
  }

  const used = new Set<string>()
  const takeSpot = (hidden: boolean) => {
    const prefer = hidden ? spots.filter((spot) => spot.light < 0.22) : spots.filter((spot) => spot.light >= 0.22)
    const pools = prefer.length > 0 ? [prefer, spots] : [spots]
    for (const pool of pools) {
      for (const spot of pool) {
        const key = `${Math.floor(spot.x)},${Math.floor(spot.y)}`
        if (used.has(key)) continue
        used.add(key)
        return spot
      }
    }
    return null
  }

  const loot: Purse[] = []
  for (const pick of picks) {
    const spot = takeSpot(pick.hidden)
    if (!spot) continue
    loot.push({ ...pick, x: spot.x, y: spot.y, taken: false })
  }
  game.purses = loot
  game.relics = []
  game.homeHold = 0
}

function resetRun(game: Game) {
  game.player.x = game.spawn.x
  game.player.y = game.spawn.y
  game.heat = 0
  game.peak = 0
  game.quiet.left = 0
  game.quiet.cd = 0
  game.shadow.left = 0
  game.shadow.cd = 0
  game.liftCd = 0
  game.sparks = []
  game.floaters = []
  game.chime = ''
  game.flash = 0
  game.elapsed = 0
  game.score = 0
  game.tally = 0
  game.purseScore = 0
  game.rareScore = 0
  game.timeScore = 0
  game.darkScore = 0
  game.pop = ''
  game.popT = 0
  game.homeHold = 0
  scatterLoot(game)
  for (const guard of game.guards) {
    guard.x = guard.homeX
    guard.y = guard.homeY
    guard.dir = guard.dir0
  }
}

function relicLive(relic: Relic, elapsed: number) {
  return !relic.taken && !relic.missed && elapsed >= relic.open && elapsed < relic.close
}

function placeRelics(game: Game) {
  for (const relic of game.relics) {
    const span = relic.close - relic.open
    const along = span <= 0 ? 0 : (game.elapsed - relic.open) / span
    const u = Math.max(0, Math.min(1, along))
    relic.x = relic.x0 + (relic.x1 - relic.x0) * u
    relic.y = relic.y0 + (relic.y1 - relic.y0) * u
  }
}

function watchRelics(game: Game) {
  for (const relic of game.relics) {
    if (relic.taken || relic.missed) continue
    if (!relic.warned && game.elapsed >= relic.open - 1.8) {
      relic.warned = true
      say(game, relic.warn)
    }
    if (game.elapsed >= relic.close) {
      relic.missed = true
      say(game, `The ${relic.name.toLowerCase()} crossed the light and was gone.`)
    }
  }
}

function tickTally(game: Game, h: number) {
  if (game.tally >= game.score) {
    game.tally = game.score
    return
  }
  game.tally = Math.min(game.score, game.tally + 120 * h)
}

function rareHud(game: Game): { rareName: string; rareLeft: number; rareState: Hud['rareState'] } {
  if (game.phase !== 'play') return { rareName: '', rareLeft: 0, rareState: 'wait' }
  const open = game.relics.find((relic) => relicLive(relic, game.elapsed))
  if (open) {
    return { rareName: open.name, rareLeft: Math.max(0, Math.ceil(open.close - game.elapsed)), rareState: 'open' }
  }
  const soon = game.relics
    .filter((relic) => !relic.taken && !relic.missed && game.elapsed < relic.open)
    .sort((a, b) => a.open - b.open)[0]
  if (soon && soon.open - game.elapsed <= 1.8) {
    return { rareName: soon.name, rareLeft: Math.max(0, Math.ceil(soon.open - game.elapsed)), rareState: 'soon' }
  }
  if (game.relics.some((relic) => relic.taken)) {
    return { rareName: 'Kept', rareLeft: 0, rareState: 'kept' }
  }
  if (game.phase === 'play' && game.relics.length > 0 && game.relics.every((relic) => relic.missed || relic.taken)) {
    return { rareName: '', rareLeft: 0, rareState: 'gone' }
  }
  return { rareName: '', rareLeft: 0, rareState: 'wait' }
}

function claimLoot(game: Game, loot: Purse) {
  const pts = loot.points
  const heavy = loot.slots >= 2 || loot.name === 'RING' || loot.name === 'GEM' || loot.name === 'MOON'
  loot.taken = true
  if (heavy) game.rareScore += pts
  else game.purseScore += pts
  game.score += pts
  game.pop = `+${pts} ${loot.name}`
  game.popT = 1.6
  game.floaters.push({ x: loot.x, y: loot.y - 0.2, text: `+${pts}`, life: 2.4 })
  game.chime = heavy ? 'rare' : 'gold'
  game.heat = clamp(game.heat - 8, 0, 100)
  const sparks = heavy ? 12 : 8
  for (let i = 0; i < sparks; i++) {
    const a = (Math.PI * 2 * i) / sparks
    game.sparks.push({
      x: loot.x,
      y: loot.y,
      vx: Math.cos(a) * (heavy ? 2.8 : 2.2),
      vy: Math.sin(a) * (heavy ? 2.8 : 2.2),
      life: 0.5,
      color: i % 2 ? '#f0c14a' : '#fff1c2',
    })
  }
  const left = PACK - packUsed(game)
  const piece = prettyLoot(loot.name)
  if (left <= 0) say(game, `${piece}, ${pts} points. The pack is full. Leave the rest.`)
  else if (left === 1) say(game, `${piece}, ${pts} points. One slot left.`)
  else say(game, `${piece}, ${pts} points. The pack can still take more.`)
}

function tryLift(game: Game) {
  if (game.liftCd > 0 || game.phase !== 'play') return
  game.liftCd = 0.45
  let nearest: Purse | null = null
  let best = 1.05
  for (const loot of game.purses) {
    if (!lootShown(game, loot)) continue
    const d = Math.hypot(game.player.x - loot.x, game.player.y - loot.y)
    if (d < best) {
      best = d
      nearest = loot
    }
  }
  if (!nearest) {
    say(game, 'Nothing in reach. Some gold only shows in the dark.')
    return
  }
  const used = packUsed(game)
  if (used + nearest.slots > PACK) {
    const piece = prettyLoot(nearest.name)
    if (used >= PACK) say(game, `The pack is full. Leave ${piece}.`)
    else say(game, `Only one slot is open. Leave ${piece}.`)
    return
  }
  const darkEnough = game.heat < 40 || game.shadow.left > 0
  if (!darkEnough) {
    game.heat = clamp(game.heat + 42, 0, 100)
    game.flash = 0.35
    say(game, 'Too bright. They see the hand.')
    if (game.heat >= 100) {
      game.chime = 'caught'
      game.phase = 'caught'
      game.score = 0
      game.tally = 0
      say(game, 'The light found you. This run keeps nothing.')
    }
    return
  }
  claimLoot(game, nearest)
}

export function stepGame(game: Game, input: FrameInput, dt: number) {
  const h = Math.min(dt, 0.05)
  game.time += h
  game.lineT = Math.max(0, game.lineT - h)
  game.popT = Math.max(0, game.popT - h)
  game.flash = Math.max(0, game.flash - h)
  tickTally(game, h)

  if (game.phase === 'title' && input.level !== game.levelId) {
    applyLevel(game, input.level)
  }

  if (input.start && (game.phase === 'title' || game.phase === 'caught' || game.phase === 'home')) {
    if (input.level !== game.levelId) applyLevel(game, input.level)
    resetRun(game)
    game.phase = 'play'
    say(game, TALE[game.levelId].open)
    return
  }

  for (const guard of game.guards) {
    const speed = guard.speed * h * guard.dir
    if (guard.axis === 'x') {
      guard.x += speed
      if (guard.x > guard.max) {
        guard.x = guard.max
        guard.dir = -1
      } else if (guard.x < guard.min) {
        guard.x = guard.min
        guard.dir = 1
      }
    } else {
      guard.y += speed
      if (guard.y > guard.max) {
        guard.y = guard.max
        guard.dir = -1
      } else if (guard.y < guard.min) {
        guard.y = guard.min
        guard.dir = 1
      }
    }
  }

  for (const spark of game.sparks) {
    spark.x += spark.vx * h
    spark.y += spark.vy * h
    spark.life -= h
  }
  game.sparks = game.sparks.filter((spark) => spark.life > 0)
  for (const floater of game.floaters) {
    floater.y -= 0.7 * h
    floater.life -= h
  }
  game.floaters = game.floaters.filter((floater) => floater.life > 0)

  if (game.phase !== 'play') {
    game.moving = false
    return
  }

  placeRelics(game)

  game.quiet.left = Math.max(0, game.quiet.left - h)
  game.quiet.cd = Math.max(0, game.quiet.cd - h)
  game.shadow.left = Math.max(0, game.shadow.left - h)
  game.shadow.cd = Math.max(0, game.shadow.cd - h)
  game.liftCd = Math.max(0, game.liftCd - h)

  if (input.quiet && game.quiet.cd <= 0 && game.quiet.left <= 0) {
    game.quiet.left = QUIET_TIME
    game.quiet.cd = QUIET_CD
    say(game, 'Quiet. The stone keeps your step.')
  }
  if (input.shadow && game.shadow.cd <= 0 && game.shadow.left <= 0) {
    game.shadow.left = SHADOW_TIME
    game.shadow.cd = SHADOW_CD
    say(game, 'Shadow. The torch misses you.')
  }
  if (input.lift) tryLift(game)

  const len = Math.hypot(input.x, input.y)
  game.moving = len > 0.1
  if (game.moving) {
    const nx = game.player.x + (input.x / len) * 2.35 * h
    const ny = game.player.y + (input.y / len) * 2.35 * h
    if (!blocked(game, nx, game.player.y)) game.player.x = nx
    if (!blocked(game, game.player.x, ny)) game.player.y = ny
  }

  const light = lightAt(game, game.player.x, game.player.y, input.reducedMotion)
  const inShadow = game.shadow.left > 0
  if (inShadow) game.heat -= 20 * h
  else if (light > 0.28) game.heat += (light - 0.18) * 48 * h
  else game.heat -= 30 * h

  for (const guard of game.guards) {
    if (!inShadow && sees(guard, game.player.x, game.player.y)) game.heat += 62 * h
    const near = Math.hypot(guard.x - game.player.x, guard.y - game.player.y) < 2.25
    if (game.moving && game.quiet.left <= 0 && near) game.heat += 36 * h
  }

  game.elapsed += h
  placeRelics(game)
  watchRelics(game)
  game.heat = clamp(game.heat, 0, 100)
  game.peak = Math.max(game.peak, game.heat)
  if (game.heat >= 100) {
    game.chime = 'caught'
    game.phase = 'caught'
    game.score = 0
    game.tally = 0
    say(game, 'The light found you. This run keeps nothing.')
    return
  }

  const inWood = tileAt(game, game.player.x, game.player.y) === WOOD
  const used = packUsed(game)
  if (inWood && used > 0 && !game.moving) {
    if (game.homeHold <= 0 && game.lineT <= 0) say(game, 'Stand. The wood is keeping the pack.')
    game.homeHold += h
    if (game.homeHold >= HOME_HOLD) {
      game.timeScore = Math.max(0, Math.round((90 - game.elapsed) * 2))
      game.darkScore = Math.round((100 - game.peak) * 2)
      game.score += game.timeScore + game.darkScore
      game.chime = 'home'
      game.pop = `+${game.timeScore + game.darkScore}`
      game.popT = 2
      game.phase = 'home'
      game.homeHold = 0
      say(game, TALE[game.levelId].home)
    }
  } else {
    game.homeHold = 0
    if (
      inWood &&
      used === 0 &&
      !game.moving &&
      game.elapsed > 0.8 &&
      game.lineT <= 0 &&
      game.line !== 'Empty hands. Find something worth carrying.'
    ) {
      say(game, 'Empty hands. Find something worth carrying.')
    }
  }
}

export function readHud(game: Game): Hud {
  const wait = (skill: Skill, total: number) => (skill.left > 0 ? 0 : skill.cd > 0 ? skill.cd / total : 0)
  return {
    phase: game.phase,
    heat: game.heat,
    purses: packUsed(game),
    need: game.need,
    line: game.lineT > 0 ? game.line : game.levelName,
    score: game.score,
    tally: Math.floor(game.tally),
    purseScore: game.purseScore,
    rareScore: game.rareScore,
    timeScore: game.timeScore,
    darkScore: game.darkScore,
    pop: game.popT > 0 ? game.pop : '',
    ...rareHud(game),
    levelId: game.levelId,
    levelName: game.levelName,
    markName: game.markName,
    quiet: { active: game.quiet.left, wait: wait(game.quiet, QUIET_CD) },
    shadow: { active: game.shadow.left, wait: wait(game.shadow, SHADOW_CD) },
    lift: { active: 0, wait: game.liftCd > 0 ? 1 : 0 },
    kept: game.purses
      .filter((loot) => loot.taken)
      .map((loot) => `${loot.name} ${loot.points}`)
      .join(', '),
  }
}

const FONT: Record<string, number[]> = {
  A: [14, 17, 17, 31, 17, 17, 17],
  B: [30, 17, 17, 30, 17, 17, 30],
  C: [14, 17, 16, 16, 16, 17, 14],
  D: [30, 17, 17, 17, 17, 17, 30],
  E: [31, 16, 16, 30, 16, 16, 31],
  F: [31, 16, 16, 30, 16, 16, 16],
  G: [14, 17, 16, 23, 17, 17, 14],
  H: [17, 17, 17, 31, 17, 17, 17],
  I: [31, 4, 4, 4, 4, 4, 31],
  K: [17, 18, 20, 24, 20, 18, 17],
  L: [16, 16, 16, 16, 16, 16, 31],
  M: [17, 27, 21, 21, 17, 17, 17],
  N: [17, 17, 25, 21, 19, 17, 17],
  O: [14, 17, 17, 17, 17, 17, 14],
  P: [30, 17, 17, 30, 16, 16, 16],
  R: [30, 17, 17, 30, 20, 18, 17],
  S: [15, 16, 16, 14, 1, 1, 30],
  T: [31, 4, 4, 4, 4, 4, 4],
  U: [17, 17, 17, 17, 17, 17, 14],
  W: [17, 17, 17, 21, 21, 27, 17],
  Y: [17, 17, 10, 4, 4, 4, 4],
  '0': [14, 17, 17, 17, 17, 17, 14],
  '1': [4, 12, 4, 4, 4, 4, 14],
  '2': [14, 17, 1, 6, 8, 16, 31],
  '3': [30, 1, 1, 14, 1, 1, 30],
  '4': [17, 17, 17, 31, 1, 1, 1],
  '5': [31, 16, 16, 30, 1, 1, 30],
  '6': [14, 16, 16, 30, 17, 17, 14],
  '7': [31, 1, 2, 4, 8, 8, 8],
  '8': [14, 17, 17, 14, 17, 17, 14],
  '9': [14, 17, 17, 15, 1, 1, 14],
  '+': [0, 4, 4, 31, 4, 4, 0],
  ' ': [0, 0, 0, 0, 0, 0, 0],
  '.': [0, 0, 0, 0, 0, 0, 4],
}

function glyph(ctx: CanvasRenderingContext2D, ch: string, x: number, y: number, color: string, scale: number) {
  const rows = FONT[ch]
  if (!rows) return 4 * scale
  ctx.fillStyle = color
  for (let row = 0; row < 7; row++) {
    const bits = rows[row] ?? 0
    for (let col = 0; col < 5; col++) {
      if (bits & (1 << (4 - col))) ctx.fillRect(x + col * scale, y + row * scale, scale, scale)
    }
  }
  return 6 * scale
}

export function drawText(ctx: CanvasRenderingContext2D, text: string, x: number, y: number, color: string, scale = 2) {
  let pen = x
  for (const ch of text) pen += glyph(ctx, ch, pen, y, color, scale)
}

function drawCentered(ctx: CanvasRenderingContext2D, text: string, y: number, color: string, scale: number) {
  const width = text.length * 6 * scale
  drawText(ctx, text, Math.round((COLS * TILE - width) / 2), y, color, scale)
}

function drawHood(ctx: CanvasRenderingContext2D, px: number, py: number, bob: number, shadowed: boolean, carried: number) {
  const x = px + 2
  const y = py + 1 + bob
  ctx.fillStyle = '#070a08'
  ctx.fillRect(x + 1, y, 12, 14)
  ctx.fillStyle = shadowed ? '#3d5244' : '#2c3c32'
  ctx.fillRect(x + 2, y + 1, 10, 3)
  ctx.fillRect(x + 1, y + 4, 12, 6)
  ctx.fillRect(x + 3, y + 10, 3, 4)
  ctx.fillRect(x + 8, y + 10, 3, 4)
  ctx.fillStyle = shadowed ? '#e7ff9a' : '#c6f54a'
  ctx.fillRect(x + 3, y + 4, 3, 2)
  ctx.fillRect(x + 8, y + 4, 3, 2)
  if (carried > 0) {
    ctx.fillStyle = '#4a3218'
    ctx.fillRect(x - 5, y + 4, 6, 8)
    ctx.fillStyle = '#2a1c0c'
    ctx.fillRect(x - 4, y + 5, 4, 1)
    ctx.fillStyle = '#f0c14a'
    ctx.fillRect(x - 4, y + 7, 3, 3)
    if (carried > 1) ctx.fillRect(x - 3, y + 6, 1, 1)
    if (carried > 2) ctx.fillRect(x - 2, y + 9, 1, 1)
  }
}

function drawGuard(ctx: CanvasRenderingContext2D, guard: Guard) {
  const x = Math.round(guard.x * TILE) - 8
  const y = Math.round(guard.y * TILE) - 8
  ctx.fillStyle = '#4a1822'
  ctx.fillRect(x + 3, y + 1, 8, 3)
  ctx.fillRect(x + 2, y + 4, 10, 6)
  ctx.fillRect(x + 4, y + 10, 2, 3)
  ctx.fillRect(x + 8, y + 10, 2, 3)
  ctx.fillStyle = '#f0c14a'
  ctx.fillRect(x + 5, y + 5, 2, 2)
  const lx = guard.axis === 'x' ? x + (guard.dir > 0 ? 12 : 0) : x + 6
  const ly = guard.axis === 'y' ? y + (guard.dir > 0 ? 12 : 0) : y + 6
  ctx.fillStyle = '#ffb13a'
  ctx.fillRect(lx, ly, 3, 3)
  ctx.fillStyle = '#fff1c2'
  ctx.fillRect(lx + 1, ly + 1, 1, 1)
}

function drawRich(ctx: CanvasRenderingContext2D, x: number, y: number) {
  const px = Math.round(x * TILE) - 7
  const py = Math.round(y * TILE) - 8
  ctx.fillStyle = '#f0c14a'
  ctx.fillRect(px + 3, py, 6, 2)
  ctx.fillRect(px + 2, py + 2, 8, 2)
  ctx.fillStyle = '#f3d7b0'
  ctx.fillRect(px + 3, py + 4, 6, 3)
  ctx.fillStyle = '#6a3a16'
  ctx.fillRect(px + 2, py + 7, 8, 5)
  ctx.fillRect(px + 3, py + 12, 2, 3)
  ctx.fillRect(px + 7, py + 12, 2, 3)
}

function drawRelic(ctx: CanvasRenderingContext2D, relic: Relic, elapsed: number, reduced: boolean) {
  if (!relicLive(relic, elapsed)) return
  const px = Math.round(relic.x * TILE)
  const py = Math.round(relic.y * TILE)
  const blink = reduced ? true : Math.floor(elapsed * 10) % 2 === 0
  ctx.fillStyle = blink ? '#fff6c8' : '#f0c14a'
  ctx.fillRect(px - 3, py - 3, 6, 6)
  ctx.fillStyle = '#fff'
  ctx.fillRect(px - 1, py - 1, 2, 2)
  const left = Math.max(1, Math.ceil(relic.close - elapsed))
  drawText(ctx, String(left), px - 2, py - 12, '#fff6c8', 1)
}

function drawLoot(ctx: CanvasRenderingContext2D, game: Game, loot: Purse, reduced: boolean) {
  if (loot.taken) return
  const px = Math.round(loot.x * TILE)
  const py = Math.round(loot.y * TILE)
  if (!lootShown(game, loot)) {
    const light = lightAt(game, loot.x, loot.y, reduced)
    if (light >= 0.35) return
    const blink = reduced ? 0.4 : 0.22 + 0.18 * Math.sin(game.time * 3 + loot.x)
    ctx.globalAlpha = blink
    ctx.fillStyle = '#8a7040'
    ctx.fillRect(px, py, 1, 1)
    ctx.globalAlpha = 1
    return
  }
  if (loot.slots >= 2) {
    ctx.fillStyle = '#fff6c8'
    ctx.fillRect(px - 1, py - 4, 2, 2)
    ctx.fillStyle = '#f0c14a'
    ctx.fillRect(px - 3, py - 2, 6, 2)
    ctx.fillRect(px - 2, py, 4, 2)
    ctx.fillRect(px - 1, py + 2, 2, 2)
  } else if (loot.name === 'COIN') {
    ctx.fillStyle = '#f0c14a'
    ctx.fillRect(px - 2, py - 2, 4, 4)
    ctx.fillStyle = '#fff1c2'
    ctx.fillRect(px - 1, py - 1, 2, 2)
  } else {
    ctx.fillStyle = '#f0c14a'
    ctx.fillRect(px - 2, py - 3, 4, 2)
    ctx.fillRect(px - 4, py - 1, 8, 6)
    ctx.fillStyle = '#6a4a10'
    ctx.fillRect(px - 1, py + 1, 2, 2)
  }
  drawText(ctx, String(loot.points), px - 8, py - 14, loot.slots >= 2 ? '#fff6c8' : '#f0c14a', 1)
}

function drawTorch(ctx: CanvasRenderingContext2D, x: number, y: number, time: number, reduced: boolean) {
  const px = Math.round(x * TILE) - 2
  const py = Math.round(y * TILE) - 6
  const frame = reduced ? 0 : Math.floor(time * 8) % 3
  ctx.fillStyle = '#3a342c'
  ctx.fillRect(px + 1, py + 6, 2, 6)
  ctx.fillStyle = frame === 2 ? '#ff8a2a' : '#ffb13a'
  ctx.fillRect(px, py + 2, 4, 4)
  ctx.fillStyle = '#fff1c2'
  ctx.fillRect(px + 1, py + 3, 2, 2)
  if (frame === 1) ctx.fillRect(px + 1, py, 2, 2)
}

export function drawGame(ctx: CanvasRenderingContext2D, game: Game, reduced: boolean) {
  const floor = ['#10141b', '#0e1218']
  for (let y = 0; y < ROWS; y++) {
    for (let x = 0; x < COLS; x++) {
      const tile = game.tiles[idx(x, y)]
      const px = x * TILE
      const py = y * TILE
      if (tile === WALL) {
        ctx.fillStyle = '#2a261f'
        ctx.fillRect(px, py, TILE, TILE)
        ctx.fillStyle = '#463e32'
        ctx.fillRect(px, py, TILE, 3)
        ctx.fillStyle = '#16130f'
        ctx.fillRect(px, py + TILE - 2, TILE, 2)
      } else if (tile === RICH) {
        ctx.fillStyle = (x + y) % 2 === 0 ? '#2a2214' : '#231c10'
        ctx.fillRect(px, py, TILE, TILE)
        ctx.fillStyle = '#3a3018'
        ctx.fillRect(px + 7, py + 7, 2, 2)
      } else if (tile === WOOD) {
        ctx.fillStyle = (x + y) % 2 === 0 ? '#122016' : '#0e1a12'
        ctx.fillRect(px, py, TILE, TILE)
        ctx.fillStyle = '#1c3324'
        ctx.fillRect(px + 3, py + 10, 2, 4)
        ctx.fillRect(px + 10, py + 4, 2, 5)
      } else {
        ctx.fillStyle = floor[(x + y) % 2]
        ctx.fillRect(px, py, TILE, TILE)
      }
      const light = tile === WALL ? 0 : lightAt(game, x + 0.5, y + 0.5, reduced)
      const dark = tile === WOOD ? 0.28 : 0.78 * (1 - Math.min(1, light * 1.15))
      if (dark > 0.04 && tile !== WALL) {
        ctx.fillStyle = `rgba(5, 6, 10, ${dark})`
        ctx.fillRect(px, py, TILE, TILE)
      }
    }
  }

  if (game.phase === 'play') {
    ctx.fillStyle = 'rgba(180, 42, 28, 0.28)'
    for (const guard of game.guards) {
      for (let step = 1; step <= 4; step++) {
        const gx = guard.axis === 'x' ? guard.x + guard.dir * step : guard.x
        const gy = guard.axis === 'y' ? guard.y + guard.dir * step : guard.y
        if (tileAt(game, gx, gy) === WALL) break
        ctx.fillRect(Math.floor(gx) * TILE, Math.floor(gy) * TILE, TILE, TILE)
      }
    }
  }

  const hx = game.home.x * TILE
  const hy = game.home.y * TILE
  ctx.fillStyle = '#1f4a30'
  ctx.fillRect(hx - 6, hy - 4, 12, 10)
  ctx.fillStyle = '#c6f54a'
  ctx.fillRect(hx - 2, hy - 1, 4, 2)

  for (const torch of game.torches) drawTorch(ctx, torch.x, torch.y, game.time, reduced)
  for (const loot of game.purses) drawLoot(ctx, game, loot, reduced)
  for (const relic of game.relics) drawRelic(ctx, relic, game.elapsed, reduced)
  for (const rich of game.riches) drawRich(ctx, rich.x, rich.y)

  for (const guard of game.guards) drawGuard(ctx, guard)

  const bob = game.moving && !reduced ? (Math.floor(game.time * 8) % 2 === 0 ? 0 : 1) : 0
  const carried = packUsed(game)
  drawHood(
    ctx,
    Math.round(game.player.x * TILE) - 8,
    Math.round(game.player.y * TILE) - 9,
    bob,
    game.shadow.left > 0,
    carried,
  )

  for (const spark of game.sparks) {
    ctx.globalAlpha = Math.max(0, spark.life * 2)
    ctx.fillStyle = spark.color
    ctx.fillRect(Math.round(spark.x * TILE), Math.round(spark.y * TILE), 2, 2)
    ctx.globalAlpha = 1
  }

  for (const floater of game.floaters) {
    ctx.globalAlpha = Math.min(1, floater.life)
    drawText(ctx, floater.text, Math.round(floater.x * TILE) - 14, Math.round(floater.y * TILE) - 16, '#c6f54a', 2)
    ctx.globalAlpha = 1
  }

  if (game.phase === 'play' && game.homeHold > 0) {
    const bar = Math.round(22 * Math.min(1, game.homeHold / HOME_HOLD))
    const bx = Math.round(game.player.x * TILE) - 11
    const by = Math.round(game.player.y * TILE) - 18
    ctx.fillStyle = '#1f4a30'
    ctx.fillRect(bx, by, 22, 3)
    ctx.fillStyle = '#c6f54a'
    ctx.fillRect(bx, by, bar, 3)
  }

  if (game.phase === 'play' && game.popT > 0 && game.pop) {
    drawCentered(ctx, game.pop, 6, '#fff6c8', 2)
  }

  if (game.phase === 'play') {
    drawText(ctx, String(Math.floor(game.tally)), 8, 22, '#c6f54a', 1)
  }

  if (game.flash > 0) {
    ctx.fillStyle = `rgba(255, 236, 190, ${game.flash})`
    ctx.fillRect(0, 0, COLS * TILE, ROWS * TILE)
  }

  if (game.phase === 'title') {
    ctx.fillStyle = 'rgba(5, 6, 10, 0.62)'
    ctx.fillRect(0, 0, COLS * TILE, ROWS * TILE)
    drawCentered(ctx, 'STAY DARK', 78, '#c6f54a', 3)
    drawCentered(ctx, 'PACK HOLDS THREE', 112, '#d7e2c8', 1)
  } else if (game.phase === 'caught') {
    ctx.fillStyle = 'rgba(40, 10, 8, 0.45)'
    ctx.fillRect(0, 0, COLS * TILE, ROWS * TILE)
    drawCentered(ctx, 'THE LIGHT FOUND YOU', 108, '#ffb13a', 2)
  } else if (game.phase === 'home') {
    ctx.fillStyle = 'rgba(5, 12, 8, 0.45)'
    ctx.fillRect(0, 0, COLS * TILE, ROWS * TILE)
    drawCentered(ctx, 'THE WOOD TAKES YOU', 108, '#c6f54a', 2)
  }
}
