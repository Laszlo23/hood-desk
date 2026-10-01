import { useMemo } from 'react'
import type { ViewId } from '../lib/nav'
import { getGamification } from '../lib/gamification'
import { listOrders } from '../lib/trade/orders'
import { listProjects } from '../lib/projects'
import { listSkillPacks, listCreators } from '../lib/market/skillMarket'
import { getSubscription } from '../lib/subscription'
import { listRewardBalances, listRewardLedger } from '../lib/rewards/ledger'
import { skillCount } from '../lib/agent/skills'
import { HOOD_TOKEN_DEPLOYED } from '../lib/hoodToken'
import { stripeConfigured } from '../lib/stripe/client'

type Props = { onNavigate: (id: ViewId, projectId?: string) => void }

export function Revenue({ onNavigate }: Props) {
  const g = useMemo(() => getGamification(), [])
  const orders = useMemo(() => listOrders(), [])
  const projects = useMemo(() => listProjects(), [])
  const packs = useMemo(() => listSkillPacks(), [])
  const creators = useMemo(() => listCreators(), [])
  const sub = useMemo(() => getSubscription(), [])
  const balances = useMemo(() => listRewardBalances(), [])
  const ledger = useMemo(() => listRewardLedger().slice(0, 8), [])
  const treasury = balances.find((b) => b.role === 'platform')
  const simFeeTotal = balances.reduce((s, b) => s + (b.credits || 0), 0)

  const metrics = [
    {
      label: 'Treasury credits (demo)',
      value: treasury ? treasury.credits.toFixed(2) : '0.00',
      note: 'Simulated fee share — not on-chain ETH',
    },
    {
      label: 'Sim fee credits (all)',
      value: simFeeTotal.toFixed(2),
      note: 'Creator + platform + bot/referrer ledgers',
    },
    {
      label: 'Sim orders',
      value: String(orders.length),
      note: 'local_ord_* fills only',
    },
    {
      label: 'Desk XP / level',
      value: `${g.xp} · L${g.level}`,
      note: `Streak ${g.streak}d · local gamification`,
    },
    {
      label: 'Projects',
      value: String(projects.length),
      note: 'localStorage keyed by wallet / anon',
    },
    {
      label: 'Skill packs / creators',
      value: `${packs.length} / ${creators.length}`,
      note: `${skillCount()} agent skills catalogued`,
    },
    {
      label: 'Plan',
      value: sub.label,
      note: stripeConfigured()
        ? 'Stripe Checkout is live'
        : 'Demo activate until Stripe keys are set',
    },
    {
      label: '$HOOD',
      value: HOOD_TOKEN_DEPLOYED ? 'Live' : 'Not deployed',
      note: '0xC774…320c · 1B mint-once · Sourcify exact match',
    },
  ]

  const runway = [
    { when: 'Live', what: '$HOOD on Robinhood Chain', amount: '1B' },
    {
      when: 'Live',
      what: 'Stripe Checkout · Starter / Desk / Desk+',
      amount: stripeConfigured() ? 'on' : 'keys missing',
    },
    { when: 'Live', what: 'NFT wallets · CCFF00 and DogiHood', amount: 'ERC-6551' },
    {
      when: 'Sim',
      what: `Orders ${orders.length} · reward entries ${ledger.length}+`,
      amount: `${simFeeTotal.toFixed(1)} credits`,
    },
    { when: 'Waiting', what: 'DEX fee → treasury (no confirmed $HOOD pool)', amount: 'TBD' },
  ]

  return (
    <section className="page revenue-page">
      <div className="page-intro">
        <p className="eyebrow">Business dashboard</p>
        <h1>Revenue</h1>
        <div className="demo-banner">
          <strong>Local / demo metrics only.</strong> Pulled from your browser ledgers (orders,
          rewards, XP, packs). Not live on-chain treasury. Swap volume stays $0 until a known RH DEX.
        </div>
      </div>

      <div className="metrics-grid">
        {metrics.map((m) => (
          <article key={m.label} className="card metric-card">
            <p className="rail-label">{m.label}</p>
            <p className="metric-value mono">{m.value}</p>
            <p className="muted metric-note">{m.note}</p>
          </article>
        ))}
      </div>

      <article className="card mt">
        <h2>Runway ledger</h2>
        <table className="ledger">
          <thead>
            <tr>
              <th>When</th>
              <th>What</th>
              <th>Amount</th>
            </tr>
          </thead>
          <tbody>
            {runway.map((row) => (
              <tr key={row.what}>
                <td className="mono">{row.when}</td>
                <td>{row.what}</td>
                <td className="mono">{row.amount}</td>
              </tr>
            ))}
          </tbody>
        </table>

        {ledger.length > 0 && (
          <>
            <h3 className="section-title mt">Recent demo reward entries</h3>
            <table className="ledger">
              <thead>
                <tr>
                  <th>When</th>
                  <th>Role</th>
                  <th>Token</th>
                  <th>Amount</th>
                </tr>
              </thead>
              <tbody>
                {ledger.map((e) => (
                  <tr key={e.id}>
                    <td className="tiny muted">{new Date(e.at).toLocaleString()}</td>
                    <td className="mono tiny">{e.role}</td>
                    <td>{e.tokenSymbol}</td>
                    <td className="mono">{e.amount.toFixed(4)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </>
        )}

        <p className="muted mt">
          Path: DEX fee → agent treasury → Desk stays online. See Ops for the loop. Trade simulate to
          grow demo credits.
        </p>
        <div className="cta-row mt">
          <button type="button" className="btn btn-primary" onClick={() => onNavigate('ops')}>
            How it runs
          </button>
          <button type="button" className="btn btn-ghost" onClick={() => onNavigate('trade')}>
            Simulate trade
          </button>
          <button type="button" className="btn btn-ghost" onClick={() => onNavigate('rewards')}>
            Rewards
          </button>
          <button type="button" className="btn btn-ghost" onClick={() => onNavigate('status')}>
            Status
          </button>
        </div>
      </article>
    </section>
  )
}
