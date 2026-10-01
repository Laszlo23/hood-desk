import { HOOD_AGENT_STATUS } from '../lib/autoTrade/communityDesk'

type Props = {
  className?: string
  /** compact = single line pill; full = ONLINE · COMMUNITY DESK · LIVE */
  compact?: boolean
}

/** HOOD agent status pill — ONLINE · COMMUNITY DESK · LIVE */
export function HoodAgentBadge({ className = '', compact }: Props) {
  if (compact) {
    return (
      <span className={`hood-agent-badge compact ${className}`.trim()} title="HOOD agent · Robinhood Chain">
        <span className="hood-agent-dot" aria-hidden />
        ONLINE · RH 4663
      </span>
    )
  }

  return (
    <div
      className={`hood-agent-badge ${className}`.trim()}
      role="status"
      aria-label={`HOOD agent ${HOOD_AGENT_STATUS.desk} ${HOOD_AGENT_STATUS.mode}`}
    >
      <span className="hood-agent-dot" aria-hidden />
      <span className="hood-agent-badge-seg">ONLINE</span>
      <span className="hood-agent-badge-sep" aria-hidden>
        ·
      </span>
      <span className="hood-agent-badge-seg accent">{HOOD_AGENT_STATUS.desk}</span>
      <span className="hood-agent-badge-sep" aria-hidden>
        ·
      </span>
      <span className="hood-agent-badge-seg sim">{HOOD_AGENT_STATUS.mode}</span>
    </div>
  )
}
