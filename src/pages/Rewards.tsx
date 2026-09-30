import { useMemo, useState } from 'react'
import { useAccount } from 'wagmi'
import {
  getCreatorCredits,
  getPlatformTreasuryTotal,
  listRewardLedger,
  listTokenCreators,
  recentTradesForCreator,
  REWARDS_DISCLAIMER,
  TRADE_FEE_SPLIT,
} from '../lib/rewards/ledger'
import {
  creatorDashboard,
  DEMO_FEE_SPLIT,
  listLedger,
} from '../lib/market/skillMarket'
import type { ViewId } from '../lib/nav'
import { VerifiedBadge } from '../components/VerifiedBadge'

type Props = { onNavigate: (id: ViewId, projectId?: string) => void }

export function Rewards({ onNavigate }: Props) {
  const { address } = useAccount()
  const [tick, setTick] = useState(0)
  void tick

  const creatorCredits = useMemo(() => getCreatorCredits(address), [address, tick])
  const treasury = useMemo(() => getPlatformTreasuryTotal(), [tick])
  const recent = useMemo(() => recentTradesForCreator(address, 15), [address, tick])
  const allLedger = useMemo(() => listRewardLedger().slice(0, 25), [tick])
  const myTokens = useMemo(() => {
    if (!address) return listTokenCreators().slice(0, 8)
    const a = address.toLowerCase()
    return listTokenCreators().filter((t) => t.creatorAddress.toLowerCase() === a)
  }, [address, tick])
  const botCreator = useMemo(() => creatorDashboard(), [tick])
  const skillLedger = useMemo(() => listLedger().slice(0, 8), [tick])

  return (
    <section className="page rewards-page">
      <div className="page-intro">
        <p className="eyebrow">Earnings</p>
        <h1>Rewards</h1>
        <div className="demo-banner">
          <strong>Demo ledger / localStorage.</strong> {REWARDS_DISCLAIMER}
        </div>
        <p className="muted">
          Creators earn when people trade your token (simulated). Fee split:{' '}
          <strong>creator {TRADE_FEE_SPLIT.creatorPct}%</strong> /{' '}
          <strong>platform {TRADE_FEE_SPLIT.platformPct}%</strong> /{' '}
          <strong>bot-or-referrer {TRADE_FEE_SPLIT.botOrReferrerPct}%</strong> of{' '}
          {TRADE_FEE_SPLIT.feeRatePct}% fee on notional. Constants in{' '}
          <code className="inline-code">src/lib/rewards/config.ts</code>.
        </p>
      </div>

      <div className="path-strip card">
        <p className="rail-label">One-click path</p>
        <div className="cta-row">
          <button type="button" className="btn btn-primary btn-sm" onClick={() => onNavigate('create')}>
            1. Create token project
          </button>
          <button type="button" className="btn btn-ghost btn-sm" onClick={() => onNavigate('projects')}>
            2. Fair launch attach
          </button>
          <button type="button" className="btn btn-ghost btn-sm" onClick={() => onNavigate('trade')}>
            3. Trade that token
          </button>
          <button type="button" className="btn btn-ghost btn-sm" onClick={() => setTick((t) => t + 1)}>
            4. Refresh rewards
          </button>
        </div>
        <p className="tiny muted mt">
          Tip: mark “I am creator” when attaching a token so fills credit your wallet.
        </p>
      </div>

      <div className="metrics-grid rewards-metrics">
        <article className="card metric-card" title="Creators earn when people trade your token (simulated).">
          <p className="rail-label">Your creator credits</p>
          <p className="metric-value mono">{creatorCredits.toFixed(4)}</p>
          <p className="muted metric-note">
            {address ? 'Connected wallet as creator' : 'Connect wallet to see your credits'}
          </p>
        </article>
        <article className="card metric-card">
          <p className="rail-label">Platform treasury</p>
          <p className="metric-value mono">{treasury.toFixed(4)}</p>
          <p className="muted metric-note">
            Hood Desk · {TRADE_FEE_SPLIT.platformPct}% of demo fees ·{' '}
            <button type="button" className="link-inline" onClick={() => onNavigate('subscribe')}>
              subs feed treasury
            </button>
          </p>
        </article>
        <article className="card metric-card">
          <p className="rail-label">Bot creator (Skill Market)</p>
          <p className="metric-value mono">
            {botCreator ? botCreator.earningsSim.toFixed(1) : '—'}
          </p>
          <p className="muted metric-note">
            {botCreator
              ? `${botCreator.handle} · follow/usage stub ${DEMO_FEE_SPLIT.creatorPct}/${DEMO_FEE_SPLIT.treasuryPct}`
              : 'Open Skill Market to publish'}
          </p>
        </article>
      </div>

      <div className="detail-grid mt">
        <article className="card">
          <h2 className="section-title">Your tokens</h2>
          {myTokens.length === 0 ? (
            <p className="muted empty-hint">
              No creator tokens yet. Creators earn when people trade your token (simulated). Create a
              project → fair launch → paste address.
            </p>
          ) : (
            <ul className="spec-list">
              {myTokens.map((t) => (
                <li key={t.tokenAddress}>
                  <span className="rail-label token-name-row">
                    ${t.tokenSymbol}
                    <VerifiedBadge address={t.tokenAddress} />
                  </span>
                  <span className="mono tiny">
                    {t.tokenAddress.slice(0, 8)}… · {t.projectName || t.projectId || '—'}
                  </span>
                </li>
              ))}
            </ul>
          )}
          <div className="cta-row mt">
            <button type="button" className="btn btn-primary btn-sm" onClick={() => onNavigate('trade')}>
              Trade →
            </button>
            <button type="button" className="btn btn-ghost btn-sm" onClick={() => onNavigate('create')}>
              Create →
            </button>
          </div>
        </article>

        <article className="card">
          <h2 className="section-title">Recent trades on your tokens</h2>
          {recent.length === 0 ? (
            <p className="muted empty-hint">
              No creator fills yet. Simulate a market buy on a token you created — Rewards update here.
            </p>
          ) : (
            <table className="ledger">
              <thead>
                <tr>
                  <th>When</th>
                  <th>Token</th>
                  <th>Credit</th>
                </tr>
              </thead>
              <tbody>
                {recent.map((e) => (
                  <tr key={e.id}>
                    <td className="mono tiny">{new Date(e.at).toLocaleString()}</td>
                    <td>${e.tokenSymbol}</td>
                    <td className="mono">+{e.amount.toFixed(4)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </article>
      </div>

      <article className="card mt">
        <h2 className="section-title">Trade fee ledger (all roles)</h2>
        {allLedger.length === 0 ? (
          <p className="muted">Empty — simulate a fill on HOOD or a project token with a creator.</p>
        ) : (
          <table className="ledger">
            <thead>
              <tr>
                <th>Role</th>
                <th>Who</th>
                <th>Token</th>
                <th>Amount</th>
              </tr>
            </thead>
            <tbody>
              {allLedger.map((e) => (
                <tr key={e.id}>
                  <td>{e.role}</td>
                  <td>{e.beneficiaryLabel}</td>
                  <td>${e.tokenSymbol}</td>
                  <td className="mono">+{e.amount.toFixed(4)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </article>

      <article className="card mt">
        <div className="row-between">
          <h2 className="section-title">Skill Market creator ledger</h2>
          <button type="button" className="btn btn-ghost btn-sm" onClick={() => onNavigate('skills')}>
            Open Skills →
          </button>
        </div>
        <p className="muted small">
          Reused bot-creator follow/usage demo ledger (70/30 stub separate from trade fee split).
        </p>
        {skillLedger.length === 0 ? (
          <p className="muted">No skill-market entries yet.</p>
        ) : (
          <ul className="spec-list">
            {skillLedger.map((e) => (
              <li key={e.id}>
                <span className="rail-label">{e.type}</span>
                <span className="tiny">{e.note}</span>
              </li>
            ))}
          </ul>
        )}
      </article>
    </section>
  )
}
