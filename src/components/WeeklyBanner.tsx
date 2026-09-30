import { useMemo } from 'react'
import { getWeeklyBanner } from '../lib/banner'
import { HoodSeal } from './HoodSeal'

type Props = {
  compact?: boolean
}

export function WeeklyBanner({ compact }: Props) {
  const banner = useMemo(() => getWeeklyBanner(), [])

  return (
    <div className={`weekly-banner${compact ? ' compact' : ''}`} role="status">
      <HoodSeal size={compact ? 28 : 34} decorative className="weekly-banner-seal" />
      <span className="weekly-banner-week">{banner.weekLabel}</span>
      <p className="weekly-banner-text">{banner.text}</p>
      {banner.overridden && <span className="weekly-banner-tag">custom</span>}
    </div>
  )
}
