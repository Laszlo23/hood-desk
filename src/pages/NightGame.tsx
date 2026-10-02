import { useEffect, useRef, useState, type PointerEvent } from 'react'
import {
  COLS,
  createGame,
  drawGame,
  LEVELS,
  moonWindowOpen,
  readHud,
  ROWS,
  stepGame,
  TILE,
  type FrameInput,
  type Hud,
  type LevelId,
  type SkillName,
} from '../game/stayDark'
import {
  grantNightRun,
  markIdFor,
  nextLevelId,
  noteNightHome,
  readNightSave,
  streakPay,
  type NightMark,
  type NightSave,
} from '../game/nightMarks'
import { playNightChime, unlockNightSound } from '../game/nightSound'
import { awardXp, getGamification } from '../lib/gamification'
import { bestOf, placeOnBoard, publishNightScore } from '../lib/nightBoard'
import { fetchNightDesk, nightShareHref, nightSharePost, pushNightRun, type Jackpot } from '../lib/nightDesk'
import { loadHoodLedger, type HoodSwapRow } from '../lib/trade/poolCandles'
import type { ViewId } from '../lib/nav'
import { useAccount } from 'wagmi'
import './night-game.css'

type Props = { onNavigate: (id: ViewId) => void }

const EMPTY: FrameInput = {
  x: 0,
  y: 0,
  quiet: false,
  shadow: false,
  lift: false,
  start: false,
  reducedMotion: false,
  level: 'gate',
}

function freshHud(): Hud {
  return readHud(createGame())
}

export function NightGame({ onNavigate }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const inputRef = useRef<FrameInput>({ ...EMPTY, level: 'gate' })
  const keysRef = useRef(new Set<string>())
  const levelRef = useRef<LevelId>('gate')
  const grantToken = useRef('')
  const { address } = useAccount()
  const addressRef = useRef(address)
  addressRef.current = address
  const [hud, setHud] = useState<Hud>(freshHud)
  const [level, setLevel] = useState<LevelId>('gate')
  const [save, setSave] = useState<NightSave>(() => readNightSave())
  const [pot, setPot] = useState<Jackpot | null>(null)
  const [shared, setShared] = useState('')
  const [street, setStreet] = useState<HoodSwapRow | null>(null)
  const [reward, setReward] = useState<{
    mark: NightMark
    fresh: boolean
    best: number
    badge: boolean
    deskXp: number
    banked: number
    streakDays: number
    streakGrew: boolean
    streakBonus: number
    record: boolean
  } | null>(null)
  const hudKey = useRef('')

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    canvas.width = COLS * TILE
    canvas.height = ROWS * TILE
    ctx.imageSmoothingEnabled = false

    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    inputRef.current.reducedMotion = reduced
    const game = createGame()
    let last = performance.now()
    let frame = 0

    const paint = (now: number) => {
      const dt = (now - last) / 1000
      last = now
      const input = inputRef.current
      const keys = keysRef.current
      let x = 0
      let y = 0
      if (keys.has('arrowleft') || keys.has('a')) x -= 1
      if (keys.has('arrowright') || keys.has('d')) x += 1
      if (keys.has('arrowup') || keys.has('w')) y -= 1
      if (keys.has('arrowdown') || keys.has('s')) y += 1
      if (input.x || input.y) {
        x += input.x
        y += input.y
      }
      stepGame(game, { ...input, x, y, level: levelRef.current, reducedMotion: reduced }, dt)
      if (game.chime) {
        try {
          playNightChime(game.chime)
        } catch {
          // A blocked audio device should not stop the run.
        }
        game.chime = ''
      }
      input.quiet = false
      input.shadow = false
      input.lift = false
      input.start = false
      drawGame(ctx, game, reduced)

      const next = readHud(game)
      const key = `${next.phase}|${next.levelId}|${Math.round(next.heat)}|${next.purses}|${next.tally}|${next.pop}|${next.combo}|${next.rareState}|${next.rareLeft}|${Math.ceil(next.quiet.active)}|${Math.ceil(next.quiet.wait * 8)}|${Math.ceil(next.shadow.active)}|${Math.ceil(next.shadow.wait * 8)}|${next.lift.wait}|${next.liftReady}|${next.line}`
      if (key !== hudKey.current) {
        hudKey.current = key
        setHud(next)
        if (next.phase === 'home' && next.score > 0) {
          const token = `${next.levelId}:${next.score}`
          if (grantToken.current !== token) {
            grantToken.current = token
            const home = noteNightHome()
            const bonus = streakPay(home.days, home.grew)
            const banked = next.score + bonus
            const granted = grantNightRun(next.levelId, banked)
            const xp = awardXp('night_clear')
            publishNightScore(addressRef.current ?? null, granted.save.total, bestOf(granted.save.best), true)
            void pushNightRun({
              address: addressRef.current ?? null,
              total: granted.save.total,
              best: bestOf(granted.save.best),
              score: banked,
              runId: `${next.levelId}:${banked}`.replace(/[^a-z0-9:_-]/gi, '').slice(0, 80),
            }).then((desk) => {
              if (desk) setPot(desk.jackpot)
            })
            if (granted.record) {
              try {
                playNightChime('best')
              } catch {
                // The home chime already landed. A missing best sting is fine.
              }
            }
            setSave(granted.save)
            setReward({
              mark: granted.mark,
              fresh: granted.fresh,
              best: granted.best,
              badge: xp.newBadges.includes('of_the_wood'),
              deskXp: xp.awarded,
              banked,
              streakDays: home.days,
              streakGrew: home.grew,
              streakBonus: bonus,
              record: granted.record,
            })
          }
        } else if (grantToken.current) {
          grantToken.current = ''
          setReward(null)
        }
      }
      frame = requestAnimationFrame(paint)
    }
    frame = requestAnimationFrame(paint)

    const onKeyDown = (event: KeyboardEvent) => {
      unlockNightSound()
      const key = event.key.toLowerCase()
      if (['arrowup', 'arrowdown', 'arrowleft', 'arrowright', ' '].includes(key)) event.preventDefault()
      if (event.repeat) return
      keysRef.current.add(key)
      if (key === '1' || key === 'q') inputRef.current.quiet = true
      if (key === '2' || key === 'e') inputRef.current.shadow = true
      if (key === '3' || key === 'f') inputRef.current.lift = true
      if (key === 'enter') inputRef.current.start = true
    }
    const onKeyUp = (event: KeyboardEvent) => {
      keysRef.current.delete(event.key.toLowerCase())
    }
    window.addEventListener('keydown', onKeyDown)
    window.addEventListener('keyup', onKeyUp)
    return () => {
      cancelAnimationFrame(frame)
      window.removeEventListener('keydown', onKeyDown)
      window.removeEventListener('keyup', onKeyUp)
    }
  }, [])

  const tap = (name: SkillName) => {
    inputRef.current[name] = true
  }

  const hold = (x: number, y: number) => {
    inputRef.current.x = x
    inputRef.current.y = y
  }

  const pressDir = (event: PointerEvent<HTMLButtonElement>, x: number, y: number) => {
    event.preventDefault()
    try {
      event.currentTarget.setPointerCapture(event.pointerId)
    } catch {
      // A pointer that already ended still sets the walk.
    }
    hold(x, y)
  }

  const playing = hud.phase === 'play'
  const heatHot = hud.heat > 68
  const picked = LEVELS.find((item) => item.id === level) ?? LEVELS[0]
  const upcoming = nextLevelId(hud.levelId)

  const begin = (id?: LevelId) => {
    unlockNightSound()
    if (id) {
      levelRef.current = id
      setLevel(id)
    }
    inputRef.current.start = true
  }

  const shown = save.total + (hud.phase === 'play' ? hud.tally : 0)
  const moon = moonWindowOpen()
  const standing = placeOnBoard(address ?? null)
  const ofTheWood = getGamification().badges.includes('of_the_wood')

  useEffect(() => {
    let live = true
    fetchNightDesk().then((desk) => {
      if (live && desk) setPot(desk.jackpot)
    })
    loadHoodLedger()
      .then((swaps) => {
        if (live) setStreet(swaps[0] ?? null)
      })
      .catch(() => {
        if (live) setStreet(null)
      })
    return () => {
      live = false
    }
  }, [])

  const gameUrl = `${window.location.origin}${window.location.pathname}#/dark`
  const shareText = nightSharePost({
    phase: hud.phase,
    score: reward?.banked ?? hud.score,
    streak: reward?.streakDays ?? save.streak,
    record: reward?.record ?? false,
    carried: save.total,
    pot: pot?.pot ?? null,
    url: gameUrl,
  })
  const shareHref = nightShareHref(shareText)

  useEffect(() => {
    const kept = readNightSave()
    if (kept.total > 0) {
      publishNightScore(address ?? null, kept.total, bestOf(kept.best), true)
      setSave(kept)
    }
  }, [address])

  return (
    <div className="night-root">
      <header className="night-top">
        <p className="night-brand">Stay dark</p>
        <p className="night-line">{hud.line}</p>
        <p className="night-total">{shown.toLocaleString('en-US')} pts</p>
        <button type="button" className="night-leave" onClick={() => onNavigate('landing')}>
          Desk
        </button>
      </header>

      <div className="night-stage">
        <canvas ref={canvasRef} className="night-canvas" width={COLS * TILE} height={ROWS * TILE} />
        {hud.phase !== 'play' && (
          <div className="night-card">
            {hud.phase === 'title' ? (
              <>
                <div className="night-levels" role="tablist" aria-label="Levels">
                  {LEVELS.map((item) => (
                    <button
                      key={item.id}
                      type="button"
                      role="tab"
                      aria-selected={level === item.id}
                      className={level === item.id ? 'is-on' : undefined}
                      onClick={() => {
                        levelRef.current = item.id
                        setLevel(item.id)
                      }}
                    >
                      {item.id === 'daily' ? 'Tonight' : item.name}
                    </button>
                  ))}
                </div>
                <p>{picked.blurb}</p>
                <ol className="night-how">
                  <li>
                    <b>1</b> Walk to a gold number.
                  </li>
                  <li>
                    <b>2</b> Press Lift. The coin leaves the map and the points count.
                  </li>
                  <li>
                    <b>3</b> Stand still in the green wood. That finishes the level.
                  </li>
                </ol>
                <p>
                  The pack holds three. A cup or a gem takes two slots, so leave what does not fit. A faint gold dot is a coin in the dark. Step close and it shows its number.
                  {moon ? ' A moon gem is hidden in the dark for these two minutes. It takes two slots.' : ''}
                </p>
                <p className="night-owned">
                  A small game, for fun. These points stay on the desk. The coin, the pool, and the ledger are the useful part.
                </p>
                <p className="night-owned">
                  {save.streak > 0
                    ? `Streak ${save.streak}. Come back tomorrow and it pays more.`
                    : save.total > 0
                      ? 'The next home opens the streak. Tomorrow it pays more.'
                      : 'Come home once. Tomorrow the streak starts paying.'}
                </p>
                {pot ? (
                  <p className="night-owned">
                    {pot.label} pot {pot.pot.toLocaleString('en-US')}. Best run {pot.best.toLocaleString('en-US')}. Desk points, kept on the server.
                  </p>
                ) : null}
                <MarkShelf save={save} />
                {ofTheWood && <p className="night-owned">Of the wood</p>}
                {standing && (
                  <p className="night-owned">
                    {standing.place} of {standing.of} on this desk
                  </p>
                )}
              </>
            ) : hud.phase === 'home' ? (
              <>
                <p className="night-score">{(reward?.banked ?? hud.score).toLocaleString('en-US')}</p>
                {reward && (
                  <article className="night-hit">
                    <p className="night-mark-kicker">{reward.record ? 'New best' : 'Home'}</p>
                    <h2>Streak {reward.streakDays}</h2>
                    <p>{streakLine(reward.streakDays, reward.streakGrew, reward.streakBonus)}</p>
                    {pot ? (
                      <p>
                        This week’s pot is {pot.pot.toLocaleString('en-US')}. Your run is in it.
                      </p>
                    ) : null}
                  </article>
                )}
                <ul className="night-break">
                  {hud.kept ? <li>Carried {hud.kept}</li> : null}
                  <li>Gold {hud.purseScore}</li>
                  <li>Heavy {hud.rareScore}</li>
                  <li>Still dark {hud.darkScore}</li>
                  <li>Time {hud.timeScore}</li>
                  {reward && reward.streakBonus > 0 ? <li>Streak +{reward.streakBonus}</li> : null}
                </ul>
                {reward?.badge && (
                  <article className="night-badge">
                    <p className="night-mark-kicker">Badge earned</p>
                    <h2>Of the wood</h2>
                    <p>Robin came home with the gold. The desk keeps this.</p>
                  </article>
                )}
                {reward && (
                  <article className="night-mark">
                    <p className="night-mark-kicker">{reward.fresh ? 'New mark' : 'Already kept'}</p>
                    <h2>{reward.mark.name}</h2>
                    <p>{reward.mark.line}</p>
                    <p className="night-mark-score">Best {reward.best.toLocaleString('en-US')}</p>
                    {reward.deskXp > 0 && (
                      <p className="night-mark-score">+{reward.deskXp} on the desk</p>
                    )}
                    <p className="night-mark-note">A desk mark. It stays on the profile card. It is not a chain mint.</p>
                  </article>
                )}
                {standing && (
                  <p className="night-owned">
                    The wood kept {save.total.toLocaleString('en-US')}. You stand {standing.place} of {standing.of}.
                  </p>
                )}
              </>
            ) : (
              <p>The rooms saw Robin. The gold stays with the rich, and this run keeps nothing.</p>
            )}
            <div className="night-card-actions">
              <button type="button" className="night-start" onClick={() => begin()}>
                {hud.phase === 'title' ? 'Step in' : 'Again'}
              </button>
              {hud.phase === 'home' && upcoming && (
                <button type="button" className="night-next" onClick={() => begin(upcoming)}>
                  Next
                </button>
              )}
              {hud.phase === 'home' && (
                <button type="button" className="night-next" onClick={() => onNavigate('account')}>
                  Your card
                </button>
              )}
              <a
                className="night-next"
                href={shareHref}
                target="_blank"
                rel="noreferrer"
                onClick={() => setShared('Opened')}
              >
                {shared || 'Share'}
              </a>
            </div>
          </div>
        )}
      </div>

      <footer className="night-dock">
        <div className="night-meters" aria-live="polite">
          <div className="night-meter">
            <span>Heat</span>
            <i className={heatHot ? 'is-hot' : undefined}>
              <b style={{ width: `${Math.round(hud.heat)}%` }} />
            </i>
          </div>
          <p className="night-purses">
            Pack {hud.purses}/{hud.need}
            {playing && hud.combo > 1 ? ` · Chain x${hud.combo}` : ''}
          </p>
          {street ? (
            <p className="night-street">
              Street {street.side} {Math.round(street.hood).toLocaleString('en-US')} HOOD
            </p>
          ) : null}
          <p className={`night-run-score${hud.pop ? ' is-pop' : ''}`}>
            {hud.tally.toLocaleString('en-US')}
            {hud.pop ? <small>{hud.pop}</small> : null}
          </p>
          {hud.rareState === 'soon' && (
            <p className="night-rare">{hud.rareName} in {hud.rareLeft}s</p>
          )}
          {hud.rareState === 'open' && (
            <p className="night-rare is-open">{hud.rareName} {hud.rareLeft}s</p>
          )}
        </div>

        <div className="night-skills">
          <SkillButton name="Quiet" hint="1" skill={hud.quiet} disabled={!playing} onTap={() => tap('quiet')} />
          <SkillButton name="Shadow" hint="2" skill={hud.shadow} disabled={!playing} onTap={() => tap('shadow')} />
          <SkillButton
            name="Lift"
            hint="3"
            skill={hud.lift}
            disabled={!playing}
            ready={playing && hud.liftReady}
            onTap={() => tap('lift')}
          />
        </div>

        <div className="night-pad" aria-hidden={!playing}>
          <button type="button" className="night-key night-key-up" onPointerDown={(e) => pressDir(e, 0, -1)} onPointerUp={() => hold(0, 0)}>
            ↑
          </button>
          <button type="button" className="night-key night-key-left" onPointerDown={(e) => pressDir(e, -1, 0)} onPointerUp={() => hold(0, 0)}>
            ←
          </button>
          <button type="button" className="night-key night-key-right" onPointerDown={(e) => pressDir(e, 1, 0)} onPointerUp={() => hold(0, 0)}>
            →
          </button>
          <button type="button" className="night-key night-key-down" onPointerDown={(e) => pressDir(e, 0, 1)} onPointerUp={() => hold(0, 0)}>
            ↓
          </button>
        </div>
        <p className="night-help">Walk to the gold number. Press Lift. Stand in the green wood.</p>
      </footer>
    </div>
  )
}

function streakLine(days: number, grew: boolean, bonus: number) {
  const tomorrow = Math.min(days + 1, 7) * 40
  if (!grew) return `It holds. Come back tomorrow and it pays ${tomorrow}.`
  if (bonus > 0) return `+${bonus} for coming back. Tomorrow pays ${tomorrow}.`
  return `Come back tomorrow and it pays ${tomorrow}.`
}

function MarkShelf({ save }: { save: NightSave }) {
  const today = ownedToday()
  return (
    <div className="night-shelf" aria-label="Marks">
      {LEVELS.map((item) => {
        const id = item.id === 'daily' ? `daily:${today}` : markIdFor(item.id)
        const mark = save.marks.find((kept) => kept.id === id)
        return (
          <article key={item.id} className={mark ? 'night-chip is-kept' : 'night-chip'}>
            <b>{item.id === 'daily' ? 'Tonight' : item.markName.replace(' mark', '')}</b>
            <span>{mark ? mark.score.toLocaleString('en-US') : '—'}</span>
          </article>
        )
      })}
    </div>
  )
}

function ownedToday() {
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

function SkillButton({
  name,
  hint,
  skill,
  disabled,
  ready = false,
  onTap,
}: {
  name: string
  hint: string
  skill: { active: number; wait: number }
  disabled: boolean
  ready?: boolean
  onTap: () => void
}) {
  const on = skill.active > 0
  const cooling = !on && skill.wait > 0
  return (
    <button
      type="button"
      className={`night-skill${on ? ' is-on' : ''}${cooling ? ' is-cool' : ''}${ready ? ' is-ready' : ''}`}
      disabled={disabled || cooling}
      onClick={onTap}
    >
      <span>{name}</span>
      <small>{on ? `${Math.ceil(skill.active)}s` : hint}</small>
      {cooling && <i style={{ transform: `scaleX(${skill.wait})` }} />}
    </button>
  )
}
