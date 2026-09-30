import { useMemo } from 'react'
import type { ViewId } from '../../lib/nav'
import { DOGIHOOD_NFT_ADDRESS } from '../../lib/nfts/dogihood'
import { skillCount } from '../../lib/agent/skills'
import {
  FEATURED_RH_TX,
  FEATURED_RH_TX_EXPLORER,
  shortHash,
} from '../../lib/status/featured'
import { lastLocalActivitySummary } from '../../lib/status/activity'
import { getGamification } from '../../lib/gamification'
import { listOrders } from '../../lib/trade/orders'

type Props = {
  onNavigate: (id: ViewId, projectId?: string) => void
}

/** Bankr-ish dense KPI / status rail under hero — local/demo counts only. */
export function StatusStrip({ onNavigate }: Props) {
  const last = useMemo(() => lastLocalActivitySummary(), [])
  const g = useMemo(() => getGamification(), [])
  const orders = useMemo(() => listOrders().length, [])
  const nftShort = DOGIHOOD_NFT_ADDRESS
    ? shortHash(DOGIHOOD_NFT_ADDRESS, 4, 4)
    : '—'

  return (
    <div className="status-strip" aria-label="Desk status">
      <div className="status-strip-head">
        <span className="status-strip-live">
          <span className="status-strip-dot" aria-hidden />
          Desk online
        </span>
        <button
          type="button"
          className="status-strip-more"
          onClick={() => onNavigate('status')}
        >
          Status feed →
        </button>
      </div>
      <div className="status-kpi-row" aria-label="Local KPIs">
        <div className="status-kpi-chip">
          <span className="status-kpi-chip-label">Chain</span>
          <strong>RH 4663</strong>
        </div>
        <div className="status-kpi-chip">
          <span className="status-kpi-chip-label">Skills</span>
          <strong>{skillCount()}</strong>
        </div>
        <div className="status-kpi-chip">
          <span className="status-kpi-chip-label">XP</span>
          <strong>
            {g.xp} · L{g.level}
          </strong>
        </div>
        <div className="status-kpi-chip">
          <span className="status-kpi-chip-label">Sim orders</span>
          <strong>{orders}</strong>
        </div>
        <div className="status-kpi-chip" title={DOGIHOOD_NFT_ADDRESS ?? ''}>
          <span className="status-kpi-chip-label">DogiHood</span>
          <strong>{nftShort}</strong>
        </div>
      </div>
      <div className="status-strip-rail">
        <a
          className="status-pill status-pill-link status-pill-warn"
          href={FEATURED_RH_TX_EXPLORER}
          target="_blank"
          rel="noreferrer noopener"
          title={`${FEATURED_RH_TX} — not found on RH`}
        >
          <em>Hash</em> {shortHash(FEATURED_RH_TX, 4, 4)} · not on RH
        </a>
        <span className={`status-pill${last ? '' : ' muted-pill'}`}>
          <em>Last</em> {last ?? 'no local activity yet'}
        </span>
      </div>
    </div>
  )
}
