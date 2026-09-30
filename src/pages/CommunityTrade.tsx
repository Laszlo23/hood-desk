import { useCallback, useEffect, useMemo, useState } from 'react'
import { HoodAgentHero } from '../components/HoodAgentHero'
import { HoodAgentBadge } from '../components/HoodAgentBadge'
import { HoodMark } from '../components/HoodMark'
import {
  STRATEGIES,
  type AgentAction,
  type CommunityDeskSettings,
  type RiskLevel,
  type ScheduleId,
  type StrategyId,
  clearCommunityDeskDemo,
  ensureSeedFeed,
  listActions,
  loadSettings,
  loadVault,
  maybeAutoTick,
  tickCommunityDesk,
  updateSettings,
  vaultTotals,
} from '../lib/autoTrade/communityDesk'
import { getTier, isDeskOrHigher } from '../lib/subscription'
import type { ViewId } from '../lib/nav'

type Props = { onNavigate: (id: ViewId, projectId?: string) => void }

function relTime(iso: string): string {
  try {
    const t = new Date(iso).getTime()
    if (Number.isNaN(t)) return ''
    const diff = Date.now() - t
    if (diff < 60_000) return 'just now'
    if (diff < 3_600_000) return `${Math.floor(diff / 60_000)}m`
    if (diff < 86_400_000) return `${Math.floor(diff / 3_600_000)}h`
    return `${Math.floor(diff / 86_400_000)}d`
  } catch {
    return ''
  }
}

function kindClass(kind: AgentAction['kind']): string {
  if (kind === 'buy') return 'side-buy'
  if (kind === 'sell') return 'side-sell'
  if (kind === 'pause') return 'kind-pause'
  if (kind === 'boost') return 'kind-boost'
  return 'kind-scan'
}

export function CommunityTrade({ onNavigate }: Props) {
  const [settings, setSettings] = useState<CommunityDeskSettings>(() => loadSettings())
  const [feed, setFeed] = useState<AgentAction[]>([])
  const [vaultTick, setVaultTick] = useState(0)
  const deskTier = isDeskOrHigher()
  const tier = getTier()

  const refresh = useCallback(() => {
    ensureSeedFeed()
    setFeed(listActions(48))
    setSettings(loadSettings())
    setVaultTick((n) => n + 1)
  }, [])

  useEffect(() => {
    refresh()
  }, [refresh])

  useEffect(() => {
    const id = window.setInterval(() => {
      const added = maybeAutoTick()
      if (added.length) refresh()
    }, 12_000)
    return () => window.clearInterval(id)
  }, [refresh])

  const vault = useMemo(() => vaultTotals(loadVault()), [vaultTick, feed])

  const patch = (p: Parameters<typeof updateSettings>[0]) => {
    setSettings(updateSettings(p))
  }

  const onToggleStrategy = (id: StrategyId, enabled: boolean) => {
    patch({ strategies: { [id]: { enabled } } })
  }

  const onAlloc = (id: StrategyId, allocationPct: number) => {
    patch({ strategies: { [id]: { allocationPct } } })
  }

  const onManualTick = () => {
    tickCommunityDesk(true)
    refresh()
  }

  const onResetDemo = () => {
    clearCommunityDeskDemo()
    ensureSeedFeed()
    refresh()
  }

  return (
    <section className="page community-trade-page">
      <HoodAgentHero
        title="Community Auto-Trade"
        eyebrow="HOOD agent · community desk"
        lead="HOOD runs paper strategies for the pack — DCA pool, momentum scout, risk-off pause, DogiHood pride. Shared demo vault + live-feeling activity feed. Labeled SIMULATED. No WalletConnect swaps. No fake verified."
        voice="HOOD here — scanning RH 4663 for the community. Desk online. Pack first."
      >
        <div className="cta-row mt">
          <button
            type="button"
            className={`btn ${settings.masterEnabled ? 'btn-ghost' : 'btn-primary'} btn-sm`}
            onClick={() => patch({ masterEnabled: !settings.masterEnabled })}
          >
            {settings.masterEnabled ? 'Pause HOOD desk' : 'Enable HOOD desk'}
          </button>
          <button type="button" className="btn btn-primary btn-sm" onClick={onManualTick}>
            Run SIM tick
          </button>
          <button type="button" className="btn btn-ghost btn-sm" onClick={() => onNavigate('trade')}>
            Trade UI
          </button>
          <button type="button" className="btn btn-ghost btn-sm" onClick={() => onNavigate('status')}>
            Status
          </button>
          <button type="button" className="btn btn-ghost btn-sm" onClick={() => onNavigate('subscribe')}>
            Desk tier
          </button>
        </div>
      </HoodAgentHero>

      <div className="demo-banner community-honesty" role="note">
        <strong>SIMULATED / demo.</strong> Community vault & agent actions live in{' '}
        <code className="inline-code">localStorage</code> only — not on-chain. $HOOD not deployed.
        No invented DEX router. WalletConnect not required.
      </div>

      <div className="community-controls card">
        <div className="community-controls-head row-between">
          <div>
            <p className="rail-label">Desk controls</p>
            <h2 className="section-title">Risk · allocation · schedule</h2>
          </div>
          <HoodAgentBadge compact />
        </div>

        <div className="community-controls-grid">
          <label className="community-field">
            <span className="tiny muted">Master</span>
            <button
              type="button"
              className={`btn btn-sm ${settings.masterEnabled ? 'btn-primary' : 'btn-ghost'}`}
              onClick={() => patch({ masterEnabled: !settings.masterEnabled })}
            >
              {settings.masterEnabled ? 'ENABLED' : 'PAUSED'}
            </button>
          </label>

          <label className="community-field">
            <span className="tiny muted">Risk level</span>
            <select
              className="input"
              value={settings.risk}
              onChange={(e) => patch({ risk: e.target.value as RiskLevel })}
            >
              <option value="calm">Calm</option>
              <option value="balanced">Balanced</option>
              <option value="spicy">Spicy</option>
            </select>
          </label>

          <label className="community-field">
            <span className="tiny muted">Schedule (demo label)</span>
            <select
              className="input"
              value={settings.schedule}
              onChange={(e) => patch({ schedule: e.target.value as ScheduleId })}
            >
              <option value="hourly">Hourly</option>
              <option value="4h">Every 4h</option>
              <option value="daily">Daily</option>
            </select>
          </label>

          <div className="community-field">
            <span className="tiny muted">Plan</span>
            <span className="community-plan-chip">
              {tier === 'free' ? 'Free · demo' : tier.replace('_', ' ')}
              {!deskTier && (
                <button type="button" className="link-btn" onClick={() => onNavigate('subscribe')}>
                  Unlock Desk UI →
                </button>
              )}
            </span>
          </div>
        </div>
      </div>

      <div className="community-strategies">
        <p className="rail-label">HOOD strategies · paper / demo</p>
        <div className="community-strategy-grid">
          {STRATEGIES.map((s) => {
            const st = settings.strategies[s.id]
            const lockedUi = Boolean(s.deskGated && !deskTier)
            return (
              <article
                key={s.id}
                className={`card community-strategy${st.enabled ? ' is-on' : ''}${lockedUi ? ' desk-gated' : ''}`}
              >
                <div className="community-strategy-top row-between">
                  <div className="row-gap">
                    <HoodMark size={36} variant="photo" />
                    <div>
                      <strong>{s.name}</strong>
                      <div className="community-strategy-tags">
                        {s.flavorOnly && <span className="badge">Flavor</span>}
                        {s.deskGated && <span className="badge">Desk tier UI</span>}
                        <span className="badge">SIM</span>
                      </div>
                    </div>
                  </div>
                  <button
                    type="button"
                    className={`btn btn-sm ${st.enabled ? 'btn-primary' : 'btn-ghost'}`}
                    onClick={() => onToggleStrategy(s.id, !st.enabled)}
                  >
                    {st.enabled ? 'On' : 'Off'}
                  </button>
                </div>
                <p className="muted tiny">{s.blurb}</p>
                <p className="hood-agent-voice tiny">
                  <span className="hood-agent-voice-label">HOOD</span>
                  {s.voice}
                </p>
                {!s.flavorOnly && (
                  <label className="community-alloc">
                    <span className="tiny muted">Allocation {st.allocationPct}%</span>
                    <input
                      type="range"
                      min={0}
                      max={100}
                      step={5}
                      value={st.allocationPct}
                      onChange={(e) => onAlloc(s.id, Number(e.target.value))}
                    />
                  </label>
                )}
                {lockedUi && (
                  <div className="community-desk-gate">
                    <p className="tiny">
                      Advanced strategy — Desk tier UI. Demo still runs without Stripe keys.
                    </p>
                    <button
                      type="button"
                      className="btn btn-ghost btn-sm"
                      onClick={() => onNavigate('subscribe')}
                    >
                      View Desk plans
                    </button>
                  </div>
                )}
              </article>
            )
          })}
        </div>
      </div>

      <div className="community-split">
        <div className="card community-vault">
          <div className="row-between">
            <div>
              <p className="rail-label">Community vault · shared PnL</p>
              <h2 className="section-title">Demo ledger</h2>
            </div>
            <span className="status-feed-badge">SIMULATED</span>
          </div>
          <div className="community-vault-kpis">
            <div className="status-kpi">
              <span className="status-kpi-label">Base</span>
              <strong className="status-kpi-value mono">{vault.base.toLocaleString()}</strong>
            </div>
            <div className="status-kpi">
              <span className="status-kpi-label">PnL</span>
              <strong className={`status-kpi-value mono ${vault.pnl >= 0 ? 'side-buy' : 'side-sell'}`}>
                {vault.pnl >= 0 ? '+' : ''}
                {vault.pnl.toFixed(2)}
              </strong>
            </div>
            <div className="status-kpi">
              <span className="status-kpi-label">Equity</span>
              <strong className="status-kpi-value mono">{vault.equity.toFixed(2)}</strong>
            </div>
            <div className="status-kpi">
              <span className="status-kpi-label">Marks</span>
              <strong className="status-kpi-value">{vault.trades}</strong>
            </div>
          </div>
          <ul className="community-vault-list">
            {loadVault()
              .entries.slice(0, 12)
              .map((e) => (
                <li key={e.id}>
                  <div>
                    <strong>{e.label}</strong>
                    <span className="tiny muted">{relTime(e.at)}</span>
                  </div>
                  <span className={`mono ${e.delta >= 0 ? 'side-buy' : 'side-sell'}`}>
                    {e.delta >= 0 ? '+' : ''}
                    {e.delta.toFixed(2)}
                  </span>
                </li>
              ))}
            {loadVault().entries.length === 0 && (
              <li className="muted">No vault marks yet — run a SIM tick.</li>
            )}
          </ul>
          <p className="tiny muted mt">
            Local demo units only — not a real shared on-chain vault.
          </p>
          <button type="button" className="btn btn-ghost btn-sm mt" onClick={onResetDemo}>
            Reset SIM feed / vault
          </button>
        </div>

        <div className="card community-feed">
          <div className="row-between">
            <div>
              <p className="rail-label">HOOD activity feed</p>
              <h2 className="section-title">Agent actions</h2>
            </div>
            <span className="status-feed-badge">SIMULATED</span>
          </div>
          <ul className="community-feed-list">
            {feed.map((a) => (
              <li key={a.id} className="community-feed-item">
                <div className="community-feed-main">
                  <div className="row-gap">
                    <HoodMark size={28} variant="photo" />
                    <div>
                      <strong className={kindClass(a.kind)}>{a.kind.toUpperCase()}</strong>
                      <span className="community-feed-strat"> · {a.strategyName}</span>
                      <div className="tiny muted">
                        {a.pair} · size {a.size}
                      </div>
                    </div>
                  </div>
                  <p className="community-feed-reason">{a.reason}</p>
                  <p className="hood-agent-voice tiny">
                    <span className="hood-agent-voice-label">HOOD</span>
                    {a.voice}
                  </p>
                </div>
                <div className="community-feed-meta">
                  <span className="status-feed-badge">SIM</span>
                  <time className="tiny muted" dateTime={a.at}>
                    {relTime(a.at)}
                  </time>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  )
}
