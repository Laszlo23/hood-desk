import { useMemo } from 'react'
import { getWeeklyBanner } from '../lib/banner'

type Props = {
  compact?: boolean
}

export function WeeklyBanner({ compact }: Props) {
  const banner = useMemo(() => getWeeklyBanner(), [])

  return (
    <div className={`weekly-banner${compact ? ' compact' : ''}`} role="status">
      <span className="weekly-banner-week">{banner.weekLabel}</span>
      <p className="weekly-banner-text">{banner.text}</p>
      {banner.overridden && <span className="weekly-banner-tag">custom</span>}
    </div>
  )
}
