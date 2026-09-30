import { useMemo, useState } from 'react'
import { FeaturedTxRow } from '../components/status/FeaturedTxRow'
import { buildLocalActivityFeed } from '../lib/status/activity'
import type { ViewId } from '../lib/nav'
import { getGamification } from '../lib/gamification'
import { listOrders } from '../lib/trade/orders'
import { DEMO_TOKENS, formatUsdCompact, formatPrice } from '../lib/trade/demoTokens'
import { skillCount } from '../lib/agent/skills'
import { listProjects } from '../lib/projects'
import { listSkillPacks } from '../lib/market/skillMarket'
import { DOGIHOOD_NFT_ADDRESS } from '../lib/nfts/dogihood'
import { shortHash } from '../lib/status/featured'

type Props = { onNavigate: (id: ViewId, projectId?: string) => void }
type RankTab = 'top' | 'trending' | 'tokens'

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

export function Status({ onNavigate }: Props) {
  const feed = useMemo(() => buildLocalActivityFeed(28), [])
  const g = useMemo(() => getGamification(), [])
  const orders = useMemo(() => listOrders(), [])
  const orderCount = orders.length
  const projects = useMemo(() => listProjects(), [])
  const packs = useMemo(() => listSkillPacks(), [])
  const [rankTab, setRankTab] = useState<RankTab>('top')

  const featuredProjects = useMemo(() => {
    const withToken = projects.filter((p) => p.fairLaunch?.tokenAddress || p.ticker)
    const pool = withToken.length ? withToken : projects
    return pool.slice(0, 4)
  }, [projects])

  const rankedPacks = useMemo(() => {
    const copy = [...packs]
    if (rankTab === 'trending') {
      return copy
        .sort((a, b) => {
          const fa = a.featured ? 1 : 0
          const fb = b.featured ? 1 : 0
          if (fb !== fa) return fb - fa
          return b.createdAt < a.createdAt ? -1 : 1
        })
        .slice(0, 8)
    }
    return copy
      .sort((a, b) => {
        if (b.followerCount !== a.followerCount) return b.followerCount - a.followerCount
        return b.rating - a.rating
      })
      .slice(0, 8)
  }, [packs, rankTab])

  const rankedOrders = useMemo(() => {
    return orders.slice(0, 8).map((o, i) => ({
      rank: i + 1,
      symbol: o.tokenSymbol,
      side: o.side,
      amount: o.amount,
      status: o.status,
      at: o.createdAt,
      id: o.id,
    }))
  }, [orders])

  const rankedTokens = useMemo(() => {
    const copy = [...DEMO_TOKENS]
    if (rankTab === 'trending') {
      return copy.sort((a, b) => Math.abs(b.change24h) - Math.abs(a.change24h))
    }
    return copy.sort((a, b) => b.volume24h - a.volume24h)
  }, [rankTab])

  return (
    <section className="page status-page">
      <header className="status-page-hero card">
        <div className="status-page-hero-top">
          <div>
            <p className="eyebrow">Hood Street · command desk</p>
            <h1 className="hero-title status-title">Status</h1>
            <p className="muted status-lead">
              Bankr-ish density with Hood flow — KPI pulse, featured cards, ranked local tables.
              Demo / local counts only. No invented DEX volume.
            </p>
          </div>
          <div className="status-kpis">
            <div className="status-kpi">
              <span className="status-kpi-label">Desk</span>
              <strong className="status-kpi-value">
                <span className="status-strip-dot" aria-hidden />
                online
              </strong>
            </div>
            <div className="status-kpi">
              <span className="status-kpi-label">Chain</span>
              <strong className="status-kpi-value">RH 4663</strong>
            </div>
            <div className="status-kpi">
              <span className="status-kpi-label">XP</span>
              <strong className="status-kpi-value">
                {g.xp} · L{g.level}
              </strong>
            </div>
            <div className="status-kpi">
              <span className="status-kpi-label">Sim orders</span>
              <strong className="status-kpi-value">{orderCount}</strong>
            </div>
            <div className="status-kpi">
              <span className="status-kpi-label">Projects</span>
              <strong className="status-kpi-value">{projects.length}</strong>
            </div>
            <div className="status-kpi">
              <span className="status-kpi-label">Skills</span>
              <strong className="status-kpi-value">{skillCount()}</strong>
            </div>
            <div className="status-kpi">
              <span className="status-kpi-label">DogiHood</span>
              <strong className="status-kpi-value mono">
                {DOGIHOOD_NFT_ADDRESS ? shortHash(DOGIHOOD_NFT_ADDRESS, 3, 3) : '—'}
              </strong>
            </div>
          </div>
        </div>
        <div className="cta-row">
          <button type="button" className="btn btn-primary btn-sm" onClick={() => onNavigate('community')}>
            Community Auto-Trade
          </button>
          <button type="button" className="btn btn-primary btn-sm" onClick={() => onNavigate('trade')}>
            Trade
          </button>
          <button type="button" className="btn btn-ghost btn-sm" onClick={() => onNavigate('skills')}>
            Skills
          </button>
          <button type="button" className="btn btn-ghost btn-sm" onClick={() => onNavigate('rewards')}>
            Rewards
          </button>
          <button type="button" className="btn btn-ghost btn-sm" onClick={() => onNavigate('terminal')}>
            Terminal
          </button>
          <button type="button" className="btn btn-ghost btn-sm" onClick={() => onNavigate('nfts')}>
            NFTs
          </button>
          <button type="button" className="btn btn-ghost btn-sm" onClick={() => onNavigate('hood')}>
            $HOOD
          </button>
        </div>
      </header>

      <FeaturedTxRow />

      <div className="status-featured-grid">
        <p className="rail-label status-section-label">Featured · projects & pack</p>
        <div className="status-featured-cards">
          <button
            type="button"
            className="status-feature-card card"
            onClick={() => onNavigate('nfts')}
          >
            <span className="status-feature-tag">Pack</span>
            <strong>DogiHood</strong>
            <span className="muted tiny">Featured NFT · RH 4663</span>
          </button>
          <button
            type="button"
            className="status-feature-card card"
            onClick={() => onNavigate('hood')}
          >
            <span className="status-feature-tag">Token</span>
            <strong>$HOOD</strong>
            <span className="muted tiny">Flagship companion · fair launch</span>
          </button>
          <button
            type="button"
            className="status-feature-card card status-feature-hood"
            onClick={() => onNavigate('community')}
          >
            <span className="status-feature-tag">Agent</span>
            <strong>HOOD Auto-Trade</strong>
            <span className="muted tiny">Community desk · SIM MODE</span>
          </button>
          {featuredProjects.map((p) => (
            <button
              key={p.id}
              type="button"
              className="status-feature-card card"
              onClick={() => onNavigate('project', p.id)}
            >
              <span className="status-feature-tag">Project</span>
              <strong>
                {p.avatarEmoji ? `${p.avatarEmoji} ` : ''}
                {p.name}
              </strong>
              <span className="muted tiny">
                {p.ticker ? `$${p.ticker}` : 'no ticker'} · {p.fairLaunch?.status ?? 'draft'}
              </span>
            </button>
          ))}
          {featuredProjects.length === 0 && (
            <button
              type="button"
              className="status-feature-card card"
              onClick={() => onNavigate('create')}
            >
              <span className="status-feature-tag">Create</span>
              <strong>Launch a project</strong>
              <span className="muted tiny">Local desk · fair launch wizard</span>
            </button>
          )}
        </div>
      </div>

      <div className="status-rank card">
        <div className="status-rank-head">
          <p className="rail-label">Ranked · Skill Market</p>
          <div className="status-rank-tabs" role="tablist" aria-label="Rank mode">
            <button
              type="button"
              role="tab"
              aria-selected={rankTab === 'top'}
              className={`status-rank-tab${rankTab === 'top' ? ' active' : ''}`}
              onClick={() => setRankTab('top')}
            >
              Top
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={rankTab === 'trending'}
              className={`status-rank-tab${rankTab === 'trending' ? ' active' : ''}`}
              onClick={() => setRankTab('trending')}
            >
              Trending
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={rankTab === 'tokens'}
              className={`status-rank-tab${rankTab === 'tokens' ? ' active' : ''}`}
              onClick={() => setRankTab('tokens')}
            >
              Tokens
            </button>
          </div>
        </div>
        {rankTab === 'tokens' ? (
          <div className="status-rank-table-wrap">
            <table className="status-rank-table">
              <thead>
                <tr>
                  <th>#</th>
                  <th>Token</th>
                  <th>Price</th>
                  <th>24h</th>
                  <th>Vol</th>
                </tr>
              </thead>
              <tbody>
                {rankedTokens.map((tok, i) => (
                  <tr key={tok.address} onClick={() => onNavigate('trade')} className="status-rank-row">
                    <td className="mono">{i + 1}</td>
                    <td>
                      <strong>
                        {tok.avatarEmoji ? `${tok.avatarEmoji} ` : ''}
                        {tok.symbol}
                      </strong>
                      <span className="muted tiny block">{tok.name}</span>
                    </td>
                    <td className="mono">{formatPrice(tok.price)}</td>
                    <td className={tok.change24h >= 0 ? 'side-buy' : 'side-sell'}>
                      {tok.change24h >= 0 ? '+' : ''}
                      {tok.change24h.toFixed(1)}%
                    </td>
                    <td className="mono">{formatUsdCompact(tok.volume24h)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <p className="tiny muted status-rank-foot">
              Seeded demo pairs only — not live RH DEX quotes. Open Trade to simulate fills.
            </p>
          </div>
        ) : (
          <>
            <div className="status-rank-table-wrap">
              <table className="status-rank-table">
                <thead>
                  <tr>
                    <th>#</th>
                    <th>Bot / pack</th>
                    <th>Followers</th>
                    <th>Rating</th>
                    <th>Tag</th>
                  </tr>
                </thead>
                <tbody>
                  {rankedPacks.map((p, i) => (
                    <tr key={p.id} onClick={() => onNavigate('skills')} className="status-rank-row">
                      <td className="mono">{i + 1}</td>
                      <td>
                        <strong>{p.name}</strong>
                        <span className="muted tiny block">@{p.authorHandle}</span>
                      </td>
                      <td>{p.followerCount}</td>
                      <td>{p.rating.toFixed(1)}</td>
                      <td>
                        {p.featured ? (
                          <span className="status-feed-badge">FEATURED</span>
                        ) : p.isDemo ? (
                          <span className="status-feed-badge">DEMO</span>
                        ) : (
                          <span className="tiny muted">local</span>
                        )}
                      </td>
                    </tr>
                  ))}
                  {rankedPacks.length === 0 && (
                    <tr>
                      <td colSpan={5} className="muted">
                        No skill packs yet — open Skills to browse demos.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
            <p className="tiny muted status-rank-foot">
              Local catalog ranks only — not live DEX volume or on-chain leaderboards.
            </p>
          </>
        )}
      </div>

      {rankedOrders.length === 0 && (
        <div className="card status-empty-orders">
          <p className="rail-label">Simulated orders</p>
          <p className="muted">
            No local fills yet. Open Trade to place a <strong>simulated</strong> order (
            <code className="inline-code">local_ord_*</code>) — Status will list it here.
          </p>
          <div className="cta-row mt">
            <button type="button" className="btn btn-primary btn-sm" onClick={() => onNavigate('trade')}>
              Open Trade
            </button>
            <button type="button" className="btn btn-ghost btn-sm" onClick={() => setRankTab('tokens')}>
              Browse demo tokens
            </button>
          </div>
        </div>
      )}

      {rankedOrders.length > 0 && (
        <div className="status-rank card">
          <div className="status-rank-head">
            <p className="rail-label">Recent simulated orders</p>
            <span className="tiny muted">SIMULATED · no live fills</span>
          </div>
          <div className="status-rank-table-wrap">
            <table className="status-rank-table">
              <thead>
                <tr>
                  <th>#</th>
                  <th>Side</th>
                  <th>Token</th>
                  <th>Amount</th>
                  <th>When</th>
                </tr>
              </thead>
              <tbody>
                {rankedOrders.map((o) => (
                  <tr key={o.id} onClick={() => onNavigate('trade')} className="status-rank-row">
                    <td className="mono">{o.rank}</td>
                    <td>
                      <strong className={o.side === 'buy' ? 'side-buy' : 'side-sell'}>
                        {o.side.toUpperCase()}
                      </strong>
                    </td>
                    <td>{o.symbol}</td>
                    <td className="mono">{o.amount}</td>
                    <td className="tiny muted">{relTime(o.at)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <div className="status-feed card">
        <div className="status-feed-head">
          <p className="rail-label">Activity feed</p>
          <span className="tiny muted">local · simulated · DogiHood pack</span>
        </div>
        <ul className="status-feed-list">
          {feed.map((item) => (
            <li key={item.id} className={`status-feed-item kind-${item.kind}`}>
              <div className="status-feed-main">
                <strong>{item.title}</strong>
                <span className="status-feed-detail muted">{item.detail}</span>
              </div>
              <div className="status-feed-meta">
                {item.badge && <span className="status-feed-badge">{item.badge}</span>}
                <time className="tiny muted" dateTime={item.at}>
                  {relTime(item.at)}
                </time>
              </div>
            </li>
          ))}
        </ul>
        {orderCount === 0 && (
          <p className="status-feed-empty muted">
            No simulated trades yet — open{' '}
            <button type="button" className="link-btn inline" onClick={() => onNavigate('trade')}>
              Trade
            </button>{' '}
            to populate the feed.
          </p>
        )}
      </div>
    </section>
  )
}
