import { useMemo } from 'react'
import type { ViewId } from '../lib/nav'
import { getGamification } from '../lib/gamification'
import { listOrders } from '../lib/trade/orders'
import { listProjects } from '../lib/projects'
import { listSkillPacks, listCreators } from '../lib/market/skillMarket'
import { getSubscription } from '../lib/subscription'
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
  const metrics = [
    {
      label: 'Signed swaps',
      value: String(orders.length),
      note: 'Wallet-signed Uniswap fills stored in this browser',
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
      when: 'Live',
      what: `Signed swaps in this browser`,
      amount: String(orders.length),
    },
    { when: 'Live', what: '1% of each $HOOD/WETH swap stays in the desk position', amount: 'pool fee' },
  ]

  return (
    <section className="page revenue-page">
      <div className="page-intro">
        <p className="eyebrow">Business dashboard</p>
        <h1>Revenue</h1>
        <p className="muted">
          The desk earns when $HOOD trades. Each swap pays 1% into the desk&apos;s pool position.
          Stripe is the other paid path.
        </p>
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

        <p className="muted mt">
          The trading fee sits in the liquidity position until it is collected. Stripe plans are separate.
        </p>
        <div className="cta-row mt">
          <button type="button" className="btn btn-primary" onClick={() => onNavigate('ops')}>
            How it runs
          </button>
          <button type="button" className="btn btn-ghost" onClick={() => onNavigate('trade')}>
            Trade
          </button>
          <button type="button" className="btn btn-ghost" onClick={() => onNavigate('rewards')}>
            Ledger
          </button>
          <button type="button" className="btn btn-ghost" onClick={() => onNavigate('status')}>
            Status
          </button>
        </div>
      </article>
    </section>
  )
}
