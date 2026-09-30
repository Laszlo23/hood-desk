import { useEffect, useState } from 'react'
import { badgeMeta, getGamification, xpProgress } from '../lib/gamification'

type Props = {
  /** Force re-read when parent bumps this */
  tick?: number
  onClick?: () => void
}

export function XpChip({ tick = 0, onClick }: Props) {
  const [prog, setProg] = useState(() => xpProgress())
  const [streak, setStreak] = useState(0)
  const [badges, setBadges] = useState<string[]>([])

  useEffect(() => {
    const g = getGamification()
    setProg(xpProgress(g))
    setStreak(g.streak)
    setBadges(g.badges.map((b) => badgeMeta(b).emoji))
  }, [tick])

  const title = `Level ${prog.level} · ${prog.xp} XP · streak ${streak}d · ${prog.into}/${prog.need} to next`

  return (
    <button
      type="button"
      className="xp-chip"
      title={title}
      onClick={onClick}
      aria-label={title}
    >
      <span className="xp-chip-lvl">Lv{prog.level}</span>
      <span className="xp-chip-bar" aria-hidden>
        <span style={{ width: `${prog.pct}%` }} />
      </span>
      <span className="xp-chip-xp mono">{prog.xp}</span>
      {streak > 0 && <span className="xp-chip-streak">🔥{streak}</span>}
      {badges.length > 0 && <span className="xp-chip-badges">{badges.join('')}</span>}
    </button>
  )
}
