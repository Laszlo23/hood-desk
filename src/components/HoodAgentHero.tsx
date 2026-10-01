import type { ReactNode } from 'react'
import { HoodMark } from './HoodMark'
import { HoodAgentBadge } from './HoodAgentBadge'

type Props = {
  title?: string
  eyebrow?: string
  lead?: string
  voice?: string
  size?: number
  className?: string
  children?: ReactNode
}

/** Prominent HOOD agent hero — character art + distinct community voice. */
export function HoodAgentHero({
  title = 'HOOD runs the community desk',
  eyebrow = 'Flagship agent · Hood Street',
  lead = '$HOOD/WETH is live on Uniswap. A swap happens when your wallet signs it.',
  voice = 'HOOD here — scanning RH 4663 for the community. No fake routers. Pack first.',
  size = 112,
  className = '',
  children,
}: Props) {
  return (
    <div className={`hood-agent-hero card ${className}`.trim()}>
      <div className="hood-agent-hero-top row-gap">
        <div className="hood-agent-hero-art">
          <HoodMark size={size} variant="photo" bounce className="hood-agent-hero-mascot" />
          <span className="hood-agent-hero-ring" aria-hidden />
        </div>
        <div className="hood-agent-hero-copy">
          <div className="row-gap">
            <HoodMark size={36} variant="logo" alt="Hood Desk" />
            <p className="eyebrow">{eyebrow}</p>
          </div>
          <h1 className="hero-title hood-agent-hero-title">{title}</h1>
          <HoodAgentBadge />
          <p className="muted hood-agent-hero-lead">{lead}</p>
          <blockquote className="hood-agent-voice">
            <span className="hood-agent-voice-label">HOOD</span>
            {voice}
          </blockquote>
          {children}
        </div>
      </div>
    </div>
  )
}
